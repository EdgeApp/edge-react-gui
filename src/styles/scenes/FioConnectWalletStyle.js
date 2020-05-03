// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { scale } from '../../util/scaling'

export const styles = StyleSheet.create({
  info: {
    paddingTop: scale(30),
    paddingLeft: scale(26),
    paddingRight: scale(26)
  },
  title: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16),
    fontWeight: 'normal',
    textAlign: 'center'
  },
  walletName: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(15),
    textAlign: 'center'
  },
  titleLarge: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(22),
    fontWeight: 'bold',
    textAlign: 'center'
  },
  spacer: {
    paddingTop: scale(20)
  },
  checkTitle: {
    fontSize: scale(15),
    color: THEME.COLORS.WHITE,
    marginLeft: scale(15)
  },
  checkBox: {
    borderStyle: 'solid',
    borderWidth: scale(2),
    borderColor: THEME.COLORS.WHITE,
    borderRadius: 15,
    width: scale(24),
    height: scale(24)
  },
  checkBoxIconOk: {
    fontSize: scale(20),
    color: THEME.COLORS.WHITE
  },
  checkBoxContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    color: THEME.COLORS.WHITE
  },
  list: {
    backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`
  },
  contentStyles: {
    paddingBottom: scale(20)
  },
  no_wallets_text: {
    padding: scale(30),
    fontSize: scale(22),
    color: THEME.COLORS.GRAY_2,
    textAlign: 'center'
  },
  wallet: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  walletSelected: {
    backgroundColor: THEME.COLORS.OPAQUE_WHITE
  },
  walletDisabled: {
    opacity: 0.4
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'row'
  },
  walletDetailsCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  walletDetailsRowCurrency: {
    fontSize: scale(18)
  },
  walletDetailsRowName: {
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  underlay: {
    color: THEME.COLORS.GRAY_3
  },
  bottomSection: {
    backgroundColor: THEME.COLORS.OPACITY_GRAY_1,
    paddingBottom: scale(20)
  },
  bottomSectionBlue: {
    backgroundColor: THEME.COLORS.BLUE_3,
    padding: scale(20),
    paddingBottom: scale(35)
  },
  button: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.BLUE_3,
    borderRadius: scale(3),
    height: scale(50),
    marginLeft: scale(15),
    marginRight: scale(15),
    marginTop: scale(15),
    marginBottom: scale(15)
  },
  connectedBtn: {
    marginTop: 0,
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  buttonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    opacity: 1,
    color: THEME.COLORS.WHITE,
    fontSize: scale(14),
    backgroundColor: THEME.COLORS.TRANSPARENT
  },
  buttonTextBlue: {
    color: THEME.COLORS.BLUE_3
  },
  btnUnderlay: {
    color: THEME.COLORS.SECONDARY
  },
  btnDisabled: {
    backgroundColor: THEME.COLORS.GRAY_2
  }
})
