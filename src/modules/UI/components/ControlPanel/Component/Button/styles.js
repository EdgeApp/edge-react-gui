// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  left: {
    flexDirection: 'row',
    width: 50,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    alignSelf: 'stretch'
  },
  right: {
    flexDirection: 'row',
    width: 50,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontSize: 16,
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.WHITE,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    alignItems: 'center',
    justifyContent: 'center'
  },
  underlay: {
    color: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`
  },
  debug: {
    borderColor: 'red',
    borderWidth: 1
  }
}

export default StyleSheet.create(rawStyles)
