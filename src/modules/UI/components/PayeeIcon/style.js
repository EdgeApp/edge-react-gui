// @flow

import { StyleSheet } from 'react-native'
import { scale } from '../../../../lib/scaling'

import THEME from '../../../../theme/variables/airbitz'

export default StyleSheet.create({
  payeeIcon: {
    width: scale(48),
    height: scale(48),
    borderRadius: 24,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    position: 'relative'
  }
})
