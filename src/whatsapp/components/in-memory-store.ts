import  { makeInMemoryStore }  from '@adiwajshing/baileys'
import logger from '../../libs/logger'
import * as path from 'path'
import getRoot from '../../libs/root-path'

const ROOT_PATH = getRoot()

const STORE_PATH = path.join(ROOT_PATH, 'baileys_store.json')

const store = makeInMemoryStore({ logger })
store.readFromFile(STORE_PATH)
setInterval(() => {
    store.writeToFile(STORE_PATH)
}, 10_000)


export default store


