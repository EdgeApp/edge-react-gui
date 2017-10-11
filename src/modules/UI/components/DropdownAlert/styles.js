import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  containerStyle: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    backgroundColor: THEME.COLORS.WHITE,
    padding: 0,
    margin: 0
  },
  titleStyle: {
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1,
    backgroundColor: 'transparent',
    fontFamily: THEME.FONTS.DEFAULT
  },
  alertIcon: {
    color: THEME.COLORS.ACCENT_RED,
  },
  infoIcon: {
    color: THEME.COLORS.PRIMARY,
  }
})
