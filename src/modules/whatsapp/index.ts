import makeWASocket, { DisconnectReason, useMultiFileAuthState, downloadMediaMessage, makeInMemoryStore  }  from '@adiwajshing/baileys'
import type { WASocket } from '@adiwajshing/baileys'

import { Boom } from '@hapi/boom'
import Pino from 'pino'
import { Stream } from 'stream'
const logger = Pino({level: 'debug'})


const RECEIVER_ID = '553197344694@s.whatsapp.net'

const globalState: {socket?: WASocket} = {} 

async function getMediaStream(messageNotification){
    //const stream = await downloadMediaMessage(messageNotification, 'stream', {}, {logger, reuploadRequest: (globalState.socket as WASocket).updateMediaMessage}) as Stream
    //stream.pipe(process.stdout)
}

function parseCommand(messageNotification: any){ 
    const { message } = messageNotification  
    if(message?.extendedTextMessage?.contextInfo?.quotedMessage){
        const { extendedTextMessage: { contextInfo } } = message


        const { quotedMessage, mentionedJid = []} = contextInfo

        if(mentionedJid.includes(RECEIVER_ID)){
            if(quotedMessage.audioMessage){
                return getMediaStream(quotedMessage.audioMessage)
            }
        }
    } 
}

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

    const store = makeInMemoryStore({ })
    // can be read from a file
    store.readFromFile('./baileys_store.json')
    // saves the state to a file every 10s
    setInterval(() => {
        store.writeToFile('./baileys_store.json')
    }, 10_000)

    
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger
    })

    store.bind(sock.ev)

    globalState.socket = sock
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close' && lastDisconnect) {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })

    sock.ev.on('messages.upsert', async ({messages: messageList}) => {
        console.log(JSON.stringify(messageList, null, 4))

        for(const messageNotification of messageList){
            if(messageNotification.key.fromMe) {
                continue
            }

            if(messageNotification.key.remoteJid){
                console.log('replying to', messageNotification.key.remoteJid)
                parseCommand(messageNotification)
                await sock.sendMessage(messageNotification.key.remoteJid, { text: 'Hello World!'})
            }

            // if(messageNotification.message?.audioMessage){
                
                
            // }
        }

       
        
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        // await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
    })

    sock.ev.on ('creds.update', saveCreds)
}

export { connectToWhatsApp }