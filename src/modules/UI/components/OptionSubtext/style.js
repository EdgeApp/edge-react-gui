// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../../../lib/scaling.js'
import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  subHeaderSyntax: {
    color: THEME.COLORS.GRAY_1,
    textAlign: 'center',
    fontSize: scale(14)
  },
  subHeaderWalletName: {
    fontWeight: 'bold',
    lineHeight: scale(26),
    fontSize: scale(18)
  }
})
