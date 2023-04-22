import { proto, AuthenticationCreds, AuthenticationState, SignalDataTypeMap, initAuthCreds, BufferJSON } from '@adiwajshing/baileys'


import RedisClient from '../../database/redis'

type categoryKey  = keyof SignalDataTypeMap

/**
 * stores the full authentication state in a redis key
 * */
 export const useMultiFileAuthState = async(folder: string): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {

	const writeData = async (data: any, file: string) => {
        const key = `${folder}:${fixFileName(file)}`
        await RedisClient.set(key, JSON.stringify(data, BufferJSON.replacer))
	}

	const readData = async(file: string) => {
		try {
            const key = `${folder}:${fixFileName(file)}`
            const data = await RedisClient.get(key)

            if(!data){
                throw new Error('No key on redis!')
            }

			return JSON.parse(data, BufferJSON.reviver)
		} catch(error) {
			return null
		}
	}

	const removeData = async(file: string) => {
		await RedisClient.del(file)
	}

	const fixFileName = (file?: string) => file?.replace(/\//g, '__')?.replace(/:/g, '-')

	const creds: AuthenticationCreds = await readData('creds.json') || initAuthCreds()

	return {
		state: {
			creds,
			keys: {
				get: async(type, ids) => {
					const data: { [_: string]: SignalDataTypeMap[typeof type] } = { }
					await Promise.all(
						ids.map(
							async id => {
								let value = await readData(`${type}-${id}.json`)
								if(type === 'app-state-sync-key' && value) {
									value = proto.Message.AppStateSyncKeyData.fromObject(value)
								}

								data[id] = value
							}
						)
					)

					return data
				},
				set: async(data) => {
					const tasks: Promise<void>[] = []
					
                    for(const category in data) {
						for(const id in data[category as categoryKey] ) {
                            const inner =  data[category as categoryKey]
                            if(inner){

                            const value = inner[id]
							const file = `${category}-${id}.json`
							tasks.push(value ? writeData(value, file) : removeData(file))
                           
                        }
							
						}
					}

					await Promise.all(tasks)
				}
			}
		},
		saveCreds: () => {
			return writeData(creds, 'creds.json')
		}
	}
}

export default () => useMultiFileAuthState('auth_info_baileys')