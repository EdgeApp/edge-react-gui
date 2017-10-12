import {StyleSheet} from 'react-native'
//import {colors as c} from '../../../../theme/variables/airbitz'
import THEME from '../../../../theme/variables/airbitz'
module.exports = StyleSheet.create({

  // buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: THEME.BUTTONS.HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonTextWrap: {

  },
  stylizedButtonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 16
  },

  primaryButtonWrap: {
    backgroundColor: THEME.COLORS.SECONDARY
  },
  primaryButton: {
    color: THEME.COLORS.GRADIENT.LIGHT // not used?
  },

  secondaryButtonWrap: {
    backgroundColor: THEME.COLORS.GRAY_2,
    alignSelf: 'flex-start'
  },
  secondaryButton: {
    color: THEME.COLORS.GRADIENT.LIGHT
  },

  tertiaryButtonWrap: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: THEME.COLORS.SECONDARY
  },
  tertiaryButton: {
    color: THEME.COLORS.SECONDARY,
    paddingHorizontal: 10
  }
})
