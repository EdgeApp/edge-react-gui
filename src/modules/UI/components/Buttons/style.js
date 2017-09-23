import {StyleSheet} from 'react-native'
import {colors as c} from '../../../../theme/variables/airbitz'

module.exports = StyleSheet.create({

  // buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonTextWrap: {

  },
  stylizedButtonText: {
    color: 'white',
    fontSize: 16
  },

  primaryButtonWrap: {
    backgroundColor: c.secondary
  },
  primaryButton: {
    color: c.gradient.light // not used?
  },

  secondaryButtonWrap: {
    backgroundColor: c.gray2,
    alignSelf: 'flex-start'
  },
  secondaryButton: {
    color: c.gradient.light
  },

  tertiaryButtonWrap: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: c.secondary
  },
  tertiaryButton: {
    color: c.secondary,
    paddingHorizontal: 10
  }
})
