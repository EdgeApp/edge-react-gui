// @flow

import { StyleSheet } from 'react-native'

import { scale } from '../../lib/scaling.js'
import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'

export const styles = {
  usableHeight: PLATFORM.usableHeight,
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  gradient: {
    height: THEME.HEADER,
    width: '100%',
    position: 'absolute'
  },
  view: {
    position: 'relative',
    top: scale(THEME.HEADER),
    paddingHorizontal: 20,
    paddingVertical: 5
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
  selectedItem: {
    backgroundColor: THEME.COLORS.GRAY_4,
    borderLeftWidth: scale(1),
    borderLeftColor: THEME.COLORS.GRAY_3,
    borderRightWidth: scale(1),
    borderRightColor: THEME.COLORS.GRAY_3
  },
  searchContainer: {
    position: 'relative',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3,
    width: '100%'
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
  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20),
    height: scale(80)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center'
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
  }
}

export default StyleSheet.create(styles)
