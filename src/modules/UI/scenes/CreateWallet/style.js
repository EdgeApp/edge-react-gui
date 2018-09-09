// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'
import { PLATFORM } from '../../../../theme/variables/platform'

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
    top: THEME.HEADER,
    paddingHorizontal: 20,
    paddingVertical: 5
  },
  walletNameInputView: {
    height: 50,
    marginBottom: 10
  },
  walletNameInput: {
    flex: 1,
    padding: 5
  },
  pickerView: {
    marginBottom: 15
  },
  picker: {
    fontFamily: THEME.FONTS.DEFAULT,
    height: 50,
    padding: 5
  },
  selectedItem: {
    backgroundColor: THEME.COLORS.GRAY_4,
    borderLeftWidth: 1,
    borderLeftColor: THEME.COLORS.GRAY_3,
    borderRightWidth: 1,
    borderRightColor: THEME.COLORS.GRAY_3
  },
  searchContainer: {
    position: 'relative',
    backgroundColor: THEME.COLORS.TRANSPARENT,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    width: '100%'
  },
  singleCryptoType: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.GRAY_3,
    paddingVertical: 10,
    paddingHorizontal: 15
  },
  singleCryptoTypeWrap: {
    flexDirection: 'column',
    flex: 1
  },
  cryptoTypeInfoWrap: {
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'space-between'
  },
  cryptoTypeLeft: {
    flexDirection: 'row'
  },
  cryptoTypeLogo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  cryptoTypeLeftTextWrap: {
    justifyContent: 'center'
  },
  cryptoTypeName: {
    fontSize: 16,
    color: THEME.COLORS.GRAY_1,
    textAlignVertical: 'center'
  },
  underlayColor: {
    color: THEME.COLORS.GRAY_4
  },
  fiatPicker: {
    height: 100
  },
  listView: {
    maxHeight: 100
  },
  listItem: {
    margin: 0,
    padding: 5,
    borderColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    fontSize: 20
  },
  textInput: {
    flex: 1
  },
  instructionalArea: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    height: 80
  },
  instructionalText: {
    fontSize: 16,
    textAlign: 'center'
  },
  reviewArea: {
    paddingVertical: 18
  },
  reviewAreaText: {
    fontSize: 16,
    lineHeight: 24
  },
  text: {
    color: THEME.COLORS.WHITE
  },
  buttons: {
    marginTop: 24,
    flexDirection: 'row'
  },
  create: {
    flex: 1
  },
  next: {
    marginLeft: 1,
    flex: 1
  },
  back: {
    marginRight: 1,
    flex: 1
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 18
  },
  cancel: {
    flex: 1,
    marginRight: 2,
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
}

export default StyleSheet.create(styles)
