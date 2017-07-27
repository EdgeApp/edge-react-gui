import { Platform } from 'react-native'
const platform = Platform.OS

export default {
  statusBarHack: (platform === 'ios') ? { marginTop: 20, flex: 1 } : { flex: 1 }
}
