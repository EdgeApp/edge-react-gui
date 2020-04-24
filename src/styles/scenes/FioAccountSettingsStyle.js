// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

export const styles = StyleSheet.create({
  list: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`
  },
  info: {
    flex: 4
  },
  infoTitle: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(18)
  },
  arrow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto'
  },
  item: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: scale(15),
    backgroundColor: THEME.COLORS.WHITE,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1
  }
})
