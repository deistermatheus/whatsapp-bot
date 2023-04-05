import { downloadContentFromMessage }  from '@adiwajshing/baileys'
import FFMpeg from '../../../libs/ffmpeg'
import type {  MediaType, DownloadableMessage } from '@adiwajshing/baileys'
import { Readable } from 'stream'

export default class MediaHandler {
    static async getWhatsappAudioStreamAsFormat(stream: Readable, format = 'mp3'){
        return FFMpeg.convertStreamToTargetFormat(stream, format)
    }

    static async getMediaStream(messageNotification: DownloadableMessage, type: MediaType){
        const downloadStream = await downloadContentFromMessage(messageNotification, type)
        return downloadStream
    }
}