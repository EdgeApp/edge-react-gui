// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'

const styles = {
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  gradient: {
    height: THEME.SPACER.HEADER,
    width: '100%',
    position: 'absolute'
  },
  content: {
    position: 'relative',
    top: scale(66),
    paddingHorizontal: scale(20),
    paddingVertical: scale(20)
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: scale(10)
  },
  row: {
    height: scale(44)
  },
  radio: {
    borderRadius: scale(9),
    width: scale(18),
    height: scale(18),
    borderWidth: scale(1),
    borderColor: THEME.COLORS.GRAY_2
  },
  selected: {
    borderColor: THEME.COLORS.ACCENT_BLUE,
    backgroundColor: THEME.COLORS.ACCENT_BLUE
  },
  label: {
    fontSize: scale(16),
    paddingLeft: scale(10),
    color: THEME.COLORS.GRAY_1,
    lineHeight: scale(16)
  },
  input: {
    marginTop: scale(10),
    marginLeft: scale(30),
    padding: scale(2),
    color: THEME.COLORS.GRAY_2
  }
}
export default StyleSheet.create(styles)
