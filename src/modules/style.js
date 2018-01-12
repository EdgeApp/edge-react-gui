// @flow

import {StyleSheet} from 'react-native'

import THEME from '../theme/variables/airbitz.js'

export const stylesRaw = {
  mainMenuContext: {
    flex: 1
  },
  main: {
    backgroundColor: THEME.COLORS.WHITE
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  helpModal: {
    flex: 1
  }
}

export const styles = StyleSheet.create(stylesRaw)
