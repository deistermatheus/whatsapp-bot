import  { useMultiFileAuthState as baileysAuthStateHook }  from '@adiwajshing/baileys'
import * as path from 'path'
import getRoot from '../../libs/root-path'

const ROOT_PATH = getRoot()

const AUTH_STATE_PATH = path.join(ROOT_PATH, 'auth_info_baileys')

const useMultiFileAuthState = async () => baileysAuthStateHook(AUTH_STATE_PATH)

export default useMultiFileAuthState