import {Platform} from 'react-native'
import THEME from '../theme/variables/airbitz.js'
const platform = Platform.OS

export default {
  statusBarHack: (platform === 'ios') ? {marginTop: 20, flex: 1} : {flex: 1},
  backButtonColor: THEME.COLORS.WHITE
}
