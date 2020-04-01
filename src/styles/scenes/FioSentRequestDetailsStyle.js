// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const backgroundColor = 'rgba(245,245,245,1.0)'

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgroundColor,
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: scale(2),
    height: scale(50),
    justifyContent: 'center',
    paddingLeft: scale(15)
  },
  line: {
    backgroundColor: THEME.COLORS.WHITE,
    height: 0,
    paddingLeft: scale(50),
    paddingRight: scale(50)
  },
  memostyle: {
    paddingLeft: scale(50),
    paddingRight: scale(50)
  },
  row: {
    height: scale(100),
    justifyContent: 'space-between',
    paddingTop: scale(40)
  },
  row2: {
    justifyContent: 'center',
    paddingLeft: scale(50),
    paddingRight: scale(50),
    paddingTop: 0
  },
  row3: {
    justifyContent: 'center',
    paddingLeft: scale(50),
    paddingTop: 0
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleRejected: {
    color: THEME.COLORS.ACCENT_RED
  },
  titleReceived: {
    color: THEME.COLORS.ACCENT_MINT
  }
})

export default styles
