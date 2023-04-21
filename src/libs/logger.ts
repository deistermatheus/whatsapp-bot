import Pino from 'pino'

const logLevel = process.env.PINO_LOG_LEVEL ?? 'info'

export default Pino({ timestamp: () => `,"time":"${new Date().toJSON()}"`, level: logLevel })