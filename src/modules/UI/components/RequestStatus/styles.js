// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  container: {
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: THEME.COLORS.SECONDARY,
    alignItems: 'center',
    backgroundColor: THEME.COLORS.GRAY_4,
    paddingTop: 10
  },
  view: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  text: {
    color: THEME.COLORS.WHITE,
    margin: 10
  },
  alert: {
    color: THEME.COLORS.ACCENT_RED
  }
})

export default styles
