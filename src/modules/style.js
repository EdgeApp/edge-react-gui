// @flow

import {StyleSheet} from 'react-native'

import THEME from '../theme/variables/airbitz.js'

export const stylesRaw = {
  mainMenuContext: {
    flex: 1
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 24,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  helpModal: {
    flex: 1
  }
}

export const styles = StyleSheet.create(stylesRaw)
