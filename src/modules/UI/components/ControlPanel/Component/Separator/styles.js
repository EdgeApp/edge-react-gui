// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  separator: {
    width: '100%',
    height: 0.8,
    backgroundColor: THEME.COLORS.OPACITY_WHITE
  }
}
export const styles = StyleSheet.create(rawStyles)
