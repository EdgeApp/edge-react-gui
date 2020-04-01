// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling.js'

const backgroundColor = 'rgba(245,245,245,1.0)'

const styles = StyleSheet.create({
  container: {
    backgroundColor: backgroundColor,
    borderBottomColor: THEME.COLORS.GRAY_3, // was #D9E2ED
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
    height: scale(80),
    justifyContent: 'space-between',
    paddingTop: scale(30)
  },
  row2: {
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: scale(50),
    paddingRight: scale(50),
    paddingTop: 0
  },
  row3: {
    display: 'flex',
    justifyContent: 'center',
    height: scale(44),
    paddingTop: 0,
    paddingLeft: scale(50),
    paddingRight: scale(50)
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  value: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(18),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  selectWalletBtn: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.OPACITY_WHITE
  }
})

export default styles
