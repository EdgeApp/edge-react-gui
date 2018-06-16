// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

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
    top: 66,
    paddingHorizontal: 20,
    paddingVertical: 20
  },
  column: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10
  },
  row: {
    height: 44
  },
  radio: {
    borderRadius: 9,
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: THEME.COLORS.GRAY_2
  },
  selected: {
    borderColor: THEME.COLORS.ACCENT_BLUE,
    backgroundColor: THEME.COLORS.ACCENT_BLUE
  },
  label: {
    fontSize: 16,
    paddingLeft: 10,
    color: THEME.COLORS.GRAY_1,
    lineHeight: 16
  },
  input: {
    marginTop: 10,
    marginLeft: 30,
    padding: 2,
    color: THEME.COLORS.GRAY_2
  }
}
export default StyleSheet.create(styles)
