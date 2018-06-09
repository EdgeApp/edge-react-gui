// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  uniqueIdentifier: {
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  text: {
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontFamily: THEME.FONTS.DEFAULT,
    color: THEME.COLORS.WHITE
  },
  debug: {
    borderColor: 'red',
    borderWidth: 1
  }
}

export const styles = StyleSheet.create(rawStyles)
export default styles
