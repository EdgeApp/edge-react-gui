// @flow
import * as Styles from '../indexStyles.js'
import THEME from '../../theme/variables/airbitz'
// import {Image} from 'react-native'

const OtpSettingsScreenStyles = {
  gradient: {
    height: THEME.HEADER
  },
  body: {
    padding: 18
  },
  hero: {
    container :{
      width:'100%',
      height: 120,
      alignItems: 'center'
    },
    icon: {
    },
    shim: {
      height: 10
    },
    imageSize: 50,
    bodyText: {
      width: '100%',
      textAlign: 'center',
      fontSize: 21,
      color: THEME.COLORS.GRAY_1
    }
  },
  shim: {
    height: 10
  },
  middle: {
    width:'100%',
    minHeight: 200
  },
  middleText: {
    width:'100%',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.GRAY_2
  },
  buttonContainer: {
    width: '100%',
    height: THEME.BUTTONS.HEIGHT
  },
  showConfirmationModal: Styles.TwoButtonModalStyle
}

export {OtpSettingsScreenStyles}
