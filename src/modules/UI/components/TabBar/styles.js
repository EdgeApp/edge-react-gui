import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  container: {
    backgroundColor: THEME.COLORS.WHITE
  },
  text: {
    alignSelf: 'center',
    marginBottom: 7,
  },
  mb: {
    marginBottom: 15
  },
  buttonText: {
    fontSize: 10,
    color: THEME.COLORS.GRAY_1
  },
  activeButton: {
    color: THEME.COLORS.PRIMARY
  },
  badgeValue: {
    color: THEME.COLORS.WHITE
  },
})
