// @flow

import { StyleSheet } from 'react-native'

import THEME from '../theme/variables/airbitz.js'

export const stylesRaw = {
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  titleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  helpModal: {
    flex: 1
  },
  footerTabStyles: {
    height: THEME.FOOTER_TABS_HEIGHT
  }
}

export const styles = StyleSheet.create(stylesRaw)
