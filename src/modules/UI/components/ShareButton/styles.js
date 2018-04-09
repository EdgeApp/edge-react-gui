/* eslint-disable flowtype/require-valid-file-annotation */

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

export const styles = {
  shareButton: {
    flex: 1,
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingVertical: 7,
    flexDirection: 'row',
    borderColor: THEME.COLORS.GRAY_4
  },
  outerView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    flex: 1
  },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2
  },
  text: {
    fontSize: 17,
    color: THEME.COLORS.WHITE
  },
  underlay: {
    color: THEME.COLORS.SECONDARY
  }
}

export default StyleSheet.create(styles)
