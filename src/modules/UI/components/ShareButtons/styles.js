// @flow
import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export const styles = {
  view: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  },
  borderRight: {
    borderColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.MID}`,
    borderRightWidth: 1
  }
}

export default StyleSheet.create(styles)
