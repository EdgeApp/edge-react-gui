// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { scale } from '../../../../util/scaling.js'

const styles = StyleSheet.create({
  view: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  }
})

export default styles
