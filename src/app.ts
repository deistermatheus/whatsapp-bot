import { connectToWhatsApp } from './whatsapp/connection'

export default class App {
    static async initWhatsapp(){
        await connectToWhatsApp()
    }
}

