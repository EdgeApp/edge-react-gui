// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { scale } from '../../../../util/scaling.js'

export const styles = {
  shareButton: {
    flex: 1,
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingVertical: scale(7),
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
  },
  outerView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(7),
    flex: 1
  },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: scale(2)
  },
  text: {
    fontSize: scale(17),
    color: THEME.COLORS.WHITE
  },
  underlay: {
    color: THEME.COLORS.SECONDARY
  }
}

export default StyleSheet.create(styles)
