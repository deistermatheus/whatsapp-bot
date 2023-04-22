import Redis from 'ioredis'
import logger from '../libs/logger'

const redisClient = new Redis({
    port: Number(process.env.REDIS_PORT) || 6379,
    host: process.env.REDIS_HOST,
    username: process.env.REDIS_USER,
    password: process.env.REDIS_PASS,
    db: 0, 
})

redisClient.once('connected', () => logger.info('Redis connected!'))
redisClient.on('error', (error) => logger.error(error))


export default redisClient