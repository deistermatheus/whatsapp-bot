import Pino from 'pino'

export default Pino({ timestamp: () => `,"time":"${new Date().toJSON()}"`, level: 'info' })