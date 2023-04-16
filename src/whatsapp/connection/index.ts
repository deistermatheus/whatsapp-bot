import { Readable } from 'stream'
import fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import FormData from 'form-data'


import  makeWASocket, { DisconnectReason, proto, WASocket, AnyMessageContent, downloadContentFromMessage } from '@adiwajshing/baileys'
import type {  MediaType, DownloadableMessage } from '@adiwajshing/baileys'

import { Boom } from '@hapi/boom'

import FFMpeg from '../../libs/ffmpeg'
import logger from '../../libs/logger'
import { delay } from '../../libs/async'
import getRoot from '../../libs/root-path'

import OpenAIApi from '../../openai/api'

import memoryStore from '../components/in-memory-store'
import useMultiFileAuthState from '../components/multi-file-auth-state'

async function connectToWhatsApp () {
    const { state, saveCreds } = await useMultiFileAuthState()

 
    const socket = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        logger,
        shouldSyncHistoryMessage: () => false
    })

    const { ev: WAEvents } = socket

    memoryStore.bind(socket.ev)
    WAEvents.on ('creds.update', saveCreds)
    WAEvents.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close' && lastDisconnect) {
            const shouldReconnect = (lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)

            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })

    WAEvents.on('messages.upsert', async ({ messages: messageList, type }) => {
        console.log("type", type)
        console.log(JSON.stringify(messageList, null, 4))

        for (const messageNotification of messageList) {
            if (messageNotification.key.fromMe) {
                await processSelfMessage(messageNotification, socket)
            } else {
                await processUserMessage(messageNotification, socket)
            }
        }
    })
}

async function processSelfMessage(message: proto.IWebMessageInfo, socket: WASocket){
    return message.messageTimestamp
}

async function processUserMessage(message: proto.IWebMessageInfo, socket: WASocket){
    const { message: whatsappMessageInfo } = message

    if(whatsappMessageInfo){
        const { conversation: textMessage, extendedTextMessage } = whatsappMessageInfo

        if(textMessage){
            console.log('função de texto simples')
            await processPlainTextMessage(message, socket)
        }

        if(extendedTextMessage){
            console.log('função pra mensagem rica')
            await processExtendedTextMessage(message, socket)
        }
    } 
}

async function processPlainTextMessage(message: proto.IWebMessageInfo, socket: WASocket){
    await socket.readMessages([message.key])
    const receiver = message.key.remoteJid
    
    if(receiver){
        await sendText({ text: 'Hello there!' }, receiver, socket)
    }
}

async function processExtendedTextMessage(message: proto.IWebMessageInfo, socket: WASocket){
    await socket.readMessages([message.key])
    const receiver = message.key.remoteJid
    const { message: whatsappMessageInfo } = message

    const targetMentionedJid = "553197344694@s.whatsapp.net"
    const mentions = whatsappMessageInfo?.extendedTextMessage?.contextInfo?.mentionedJid ?? []
    const isCommand = whatsappMessageInfo?.extendedTextMessage?.text?.includes('/transcribe')
    
    
    if(receiver && mentions.includes(targetMentionedJid) && isCommand){
        await transcribeAudioAndReply(message, receiver, socket)
    }
}

async function transcribeAudioAndReply(message: proto.IWebMessageInfo, receiver: string, socket: WASocket){
    const { message: whatsappMessageInfo } = message
    const { quotedMessage } =  whatsappMessageInfo?.extendedTextMessage?.contextInfo as proto.IContextInfo
    
    if(quotedMessage?.audioMessage){
        const stream = await getMediaStream(quotedMessage.audioMessage, 'audio')
        const convertedAudioStream = await getWhatsappAudioStreamAsFormat(stream, 'mp3')
        const assignProp = (target: any, path: string, value: any) => {
            target[path] = value
        }

       assignProp(convertedAudioStream, 'path', 'test.mp3')
        
        try {
        
           
            const { data } = await OpenAIApi.createTranscription(convertedAudioStream, 'whisper-1')

            if(data.text){
                await sendText({text: data.text}, message.key.remoteJid || '', socket)
            }
        } catch(error){
           console.error(error)
        }
       
    }
}

async function sendMessageWithTypingDelay(message: AnyMessageContent, receiver: string, socket: WASocket, callback: any){
    await socket.presenceSubscribe(receiver)
    await delay(500)

    await socket.sendPresenceUpdate('composing', receiver)
    await delay(2000)

    await socket.sendPresenceUpdate('paused', receiver)

    if (typeof callback === 'function') {
        await callback(message, receiver, socket)
    }
}

async function sendText(message: AnyMessageContent, receiver: string, socket: WASocket){
    await socket.sendMessage(receiver, message)
}

async function getMediaStream(messageNotification: DownloadableMessage, type: MediaType){
    return await downloadContentFromMessage(messageNotification, type)
}

async function getWhatsappAudioStreamAsFormat(stream: Readable, format = 'mp3'){
    return FFMpeg.convertStreamToTargetFormat(stream, format)
}

export { connectToWhatsApp }