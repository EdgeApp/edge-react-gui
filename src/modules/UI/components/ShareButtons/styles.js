// @flow
import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

export const styles = {
  view: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  borderRight: {
    borderColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.MID}`,
    borderRightWidth: 0.5,
  },
  borderLeft: {
    borderColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.MID}`,
    borderLeftWidth: 0.5
  }
}

export default StyleSheet.create(styles)
