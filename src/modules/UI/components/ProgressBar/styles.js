// @flow
import { StyleSheet } from 'react-native'
import { THEME } from '../../../../theme/variables/airbitz.js'

export const styles = {
  container: {
    flexDirection: 'row',
    height: 3
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: THEME.COLORS.ACCENT_MINT
  }
}

export default StyleSheet.create(styles)