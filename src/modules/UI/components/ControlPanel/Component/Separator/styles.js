// @flow

import { StyleSheet } from 'react-native'

import { THEME } from '../../../../../../theme/variables/airbitz.js'

export const rawStyles = {
  separator: {
    width: '100%',
    borderColor: THEME.COLORS.OPACITY_WHITE,
    borderWidth: 0.8
  }
}
export const styles = StyleSheet.create(rawStyles)
export default styles
