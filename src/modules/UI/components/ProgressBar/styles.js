// @flow
import { StyleSheet } from 'react-native'

import { THEME } from '../../../../theme/variables/airbitz.js'

export const styles = {
  container: {
    flexDirection: 'row'
  },
  bar: {
    position: 'absolute',
    left: 0,
    top: -3,
    bottom: 0,
    backgroundColor: THEME.COLORS.ACCENT_MINT,
    zIndex: 100
  }
}

export default StyleSheet.create(styles)
