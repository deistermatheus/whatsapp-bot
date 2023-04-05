import ffmpeg from 'fluent-ffmpeg'
import { Readable } from 'stream'

export default class FFMpeg {
    static convertStreamToTargetFormat(mediaStream: Readable, format: string){
        return ffmpeg().input(mediaStream).toFormat(format)
        .on('error', (err) => {
            console.log('An error occurred: ' + err.message);
        })
        .on('progress', (progress) => {
            // console.log(JSON.stringify(progress));
            console.log('Processing: ' + progress.targetSize + ' KB converted');
        })
        .on('end', () => {
            console.log('Processing finished !');
        })
        .save('./hello.mp3')
    }
}



