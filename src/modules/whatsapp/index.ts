import makeWASocket, { DisconnectReason, useMultiFileAuthState, downloadContentFromMessage, makeInMemoryStore, WAMessage, WAGenericMediaMessage  }  from '@adiwajshing/baileys'
import type { WASocket, MediaType, DownloadableMessage, Message } from '@adiwajshing/baileys'

import MediaHandler from './handlers/media-handler'

import { Boom } from '@hapi/boom'
import Pino from 'pino'
const logger = Pino({level: 'debug'})


const globalState: {socket?: WASocket} = {} 


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

        for (const messageNotification of messageList) {
            
            if(messageNotification.key.fromMe) {
                continue
            }

            if(messageNotification.key.remoteJid){
                console.log('replying to', messageNotification.key.remoteJid)
                await parseCommand(messageNotification)
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