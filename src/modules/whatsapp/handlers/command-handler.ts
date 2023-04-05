import MediaHandler from "./media-handler"
import type { WAMessage } from '@adiwajshing/baileys'

import { RECEIVER_ID } from "../../config/constants"

export default class CommandHandler {
    private static get commandKeywords(){
        return ['transcribe']
    }

    private static mentionsBot(mentionedJid: string[]){
        return mentionedJid.includes(RECEIVER_ID)
    }

    private static buildCommandsRegExp(commands: string[]) {
        return new RegExp(`/^(${commands.join('|')}) `, 'i')
    }

    private static isCommandExpression(commandText: string, keywords = CommandHandler.commandKeywords){
        return CommandHandler.buildCommandsRegExp(keywords).test(commandText)
    }

    private static checkNotificationForBotCommand(messageNotification: WAMessage){
        const { message } = messageNotification
        
        const commandCheckResult = {
            hasTargetMessage: false,
            isCommand: false
        }
        
        if(message?.extendedTextMessage?.contextInfo?.quotedMessage){
            const { extendedTextMessage: { contextInfo } } = message
    
    
            const { quotedMessage, mentionedJid = []} = contextInfo

            commandCheckResult.hasTargetMessage = Boolean(quotedMessage)
    
            if (CommandHandler.mentionsBot(mentionedJid as string[])) {
                const promptText = message?.extendedTextMessage?.text ?? ''
                commandCheckResult.isCommand = CommandHandler.isCommandExpression(promptText)           
            }


            return commandCheckResult
        } 
    }

    static async processMessageAsCommand(messageNotification: WAMessage){
        const { isCommand, hasTargetMessage } = CommandHandler.checkNotificationForBotCommand(messageNotification)
    }

    // static parseCommandExpression(){

    // }

    // static async 


    // static async parseBotCommand(messageNotification: WAMessage){ 
    //     const { message } = messageNotification  
        
    //     if(message?.extendedTextMessage?.contextInfo?.quotedMessage){
    //         const { extendedTextMessage: { contextInfo } } = message
    
    
    //         const { quotedMessage, mentionedJid = []} = contextInfo
    
    //         if((mentionedJid as string[]).includes(RECEIVER_ID)){
    //             if(quotedMessage?.audioMessage){
    //                 const stream = await MediaHandler.getMediaStream(quotedMessage.audioMessage, 'audio')
    //                 await MediaHandler.getWhatsappAudioStreamAsFormat(stream, 'ogg')
    //             }
    //         }
    //     } 
    // }
}