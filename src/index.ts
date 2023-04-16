import { config } from 'dotenv'
config()
import app from './app'

app.start()
app.initWhatsapp()