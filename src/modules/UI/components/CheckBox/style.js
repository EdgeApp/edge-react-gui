// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  checkBoxOutline: {
    borderWidth: 1,
    borderRadius: 3,
    height: 28,
    width: 28,
    borderColor: THEME.COLORS.GRAY_1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  checkmark: {}
})

export default styles
