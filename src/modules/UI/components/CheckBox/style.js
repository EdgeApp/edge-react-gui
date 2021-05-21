// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  checkBoxOutline: {
    alignItems: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderColor: THEME.COLORS.GRAY_1,
    borderRadius: 3,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28
  },
  checkmark: {}
})

export default styles
