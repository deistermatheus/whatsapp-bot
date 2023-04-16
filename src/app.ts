import { connectToWhatsApp } from './whatsapp/connection'

export default class App {
    static start(){
        console.log('TS is on!')
    }

    static async initWhatsapp(){
        await connectToWhatsApp()
    }
}

