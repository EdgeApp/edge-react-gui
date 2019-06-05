// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'

export const styles = {
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%',
    position: 'absolute'
  },
  scrollableGradient: {
    height: THEME.HEADER
  },
  content: {
    backgroundColor: THEME.COLORS.WHITE,
    flex: 1,
    paddingHorizontal: scale(20)
  },
  view: {
    position: 'relative',
    top: THEME.HEADER,
    paddingHorizontal: 20,
    height: PLATFORM.usableHeight
  },
  scrollableView: {
    position: 'relative',
    paddingHorizontal: 20
  },
  walletNameInputView: {
    height: scale(50),
    marginBottom: scale(10)
  },
  walletNameInput: {
    flex: 1,
    padding: scale(5)
  },
  pickerView: {
    marginBottom: scale(15)
  },
  picker: {
    fontFamily: THEME.FONTS.DEFAULT,
    height: scale(50),
    padding: scale(5)
  },
  resultList: {
    backgroundColor: THEME.COLORS.WHITE,
    borderTopColor: THEME.COLORS.GRAY_3,
    borderTopWidth: 1,
    flex: 1
  },
  selectedItem: {
    backgroundColor: THEME.COLORS.GRAY_4,
    borderLeftWidth: scale(1),
    borderLeftColor: THEME.COLORS.GRAY_3,
    borderRightWidth: scale(1),
    borderRightColor: THEME.COLORS.GRAY_3
  },
  singleCryptoType: {
    height: scale(60),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingVertical: scale(10),
    paddingHorizontal: scale(15)
  },
  singleCryptoTypeWrap: {
    flexDirection: 'column',
    flex: 1
  },
  cryptoTypeInfoWrap: {
    flexDirection: 'row',
    height: scale(40),
    flex: 1,
    justifyContent: 'space-between'
  },
  cryptoTypeLeft: {
    flexDirection: 'row'
  },
  cryptoTypeLogo: {
    width: scale(40),
    height: scale(40),
    marginRight: scale(10)
  },
  cryptoTypeLeftTextWrap: {
    justifyContent: 'center'
  },
  cryptoTypeName: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_1,
    textAlignVertical: 'center'
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_4
  },
  fiatPicker: {
    height: scale(100)
  },
  listView: {
    maxHeight: scale(100)
  },
  listItem: {
    margin: 0,
    padding: scale(5),
    borderColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    fontSize: scale(20)
  },
  textInput: {
    flex: 1
  },
  currencyLogoWrapper: {},
  currencyLogo: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(64)
  },
  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  createWalletPromptArea: {
    paddingTop: scale(16),
    paddingBottom: scale(8)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1
  },
  handleRequirementsText: {
    fontSize: scale(16),
    textAlign: 'left',
    color: THEME.COLORS.GRAY_1
  },
  reviewArea: {
    paddingVertical: scale(18)
  },
  reviewAreaText: {
    fontSize: scale(16),
    lineHeight: scale(24)
  },
  text: {
    color: THEME.COLORS.WHITE
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  create: {
    flex: 1
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  },
  back: {
    marginRight: scale(1),
    flex: 1
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(18)
  },
  cancel: {
    flex: 1,
    marginRight: scale(2),
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  selectPaymentLower: {
    backgroundColor: THEME.COLORS.GRAY_4,
    width: '100%',
    marginVertical: scale(8),
    paddingHorizontal: scale(16)
  },
  paymentAndIconArea: {
    flexDirection: 'row'
  },
  paymentArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    flex: 1
  },
  paymentLeft: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2
  },
  paymentLeftIconWrap: {
    paddingVertical: scale(12),
    marginRight: 6
  },
  paymentLeftIcon: {
    width: scale(22),
    height: scale(22)
  },
  paymentRight: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2,
    fontWeight: '500'
  },
  accountReviewWalletNameArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: scale(14),
    paddingBottom: scale(8),
    alignItems: 'center'
  },
  accountReviewWalletNameText: {
    fontSize: scale(16),
    color: THEME.COLORS.SECONDARY,
    fontWeight: 'bold'
  },
  accountReviewInfoArea: {
    width: '100%',
    marginVertical: scale(10),
    paddingHorizontal: scale(10)
  },
  accountReviewInfoText: {
    color: THEME.COLORS.GRAY_2
  },
  accountReviewConfirmArea: {
    width: '100%',
    marginTop: scale(12),
    marginBottom: scale(12),
    paddingHorizontal: scale(10)
  },
  accountReviewConfirmText: {
    color: THEME.COLORS.GRAY_2,
    textAlign: 'center'
  },
  confirmButtonArea: {
    marginHorizontal: scale(30)
  },
  confirmButton: {},
  feedbackIcon: {
    alignSelf: 'flex-end',
    marginTop: scale(43),
    width: scale(25),
    height: scale(25)
  },
  createWalletImportTransitionText: {
    fontSize: 24,
    textAlign: 'center',
    color: THEME.COLORS.SECONDARY
  }
}

export default StyleSheet.create(styles)
