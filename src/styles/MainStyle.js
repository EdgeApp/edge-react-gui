// @flow

import { StyleSheet } from 'react-native'

import THEME from '../theme/variables/airbitz.js'

export const stylesRaw = {
  titleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  titleImage: {
    height: 25,
    width: 25,
    marginRight: 8,
    resizeMode: 'contain'
  },
  titleStyle: {
    alignSelf: 'center',
    fontSize: 20,
    color: THEME.COLORS.WHITE,
    fontFamily: THEME.FONTS.DEFAULT
  },
  helpModal: {
    flex: 1
  },
  footerTabStyles: {
    height: THEME.FOOTER_TABS_HEIGHT
  }
}

export const styles = StyleSheet.create(stylesRaw)
