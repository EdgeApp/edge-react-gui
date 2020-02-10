// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  info: {
    paddingTop: scale(30),
    paddingLeft: scale(6),
    paddingRight: scale(6)
  },
  mainView: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: THEME.COLORS.WHITE,
    paddingTop: scale(90),
    paddingBottom: scale(20),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  mainViewBg: {
    paddingTop: scale(90),
    paddingBottom: scale(20),
    paddingLeft: scale(15),
    paddingRight: scale(15)
  },
  textWhite: {
    color: THEME.COLORS.WHITE
  },
  textBlack: {
    color: THEME.COLORS.BLACK
  },
  texts: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    marginTop: scale(40)
  },
  balanceTitle: {
    textAlign: 'center'
  },
  balanceTitleDisabled: {
    color: THEME.COLORS.ACCENT_RED,
    fontWeight: 'normal',
    textAlign: 'center'
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: scale(58),
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  },
  errMsg: {
    marginTop: scale(20),
    color: THEME.COLORS.ACCENT_RED,
    fontSize: scale(14),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleDisabled: {
    color: THEME.COLORS.ACCENT_RED,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  titleLarge: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  blockPadding: {
    paddingTop: scale(54),
    paddingLeft: scale(20),
    paddingRight: scale(20)
  },
  spacer: {
    paddingTop: scale(20)
  }
})

export default styles
