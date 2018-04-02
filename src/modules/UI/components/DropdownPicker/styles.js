/* eslint-disable flowtype/require-valid-file-annotation */

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    padding: 20,
    backgroundColor: THEME.COLORS.WHITE
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
  listView: {
    maxHeight: 200
  },
  listItem: {
    margin: 0,
    padding: 5,
    borderColor: THEME.COLORS.GRAY_4,
    borderBottomWidth: 1,
    fontSize: 20
  },
  listStyle: {
    position: 'absolute',
    marginBottom: 100,
    paddingBottom: 100
  },
  textInput: {
    flex: 1
  },
  text: {
    color: THEME.COLORS.WHITE
  },
  buttons: {
    marginTop: 24,
    height: 44,
    flexDirection: 'row'
  },
  submit: {
    flex: 1,
    marginLeft: 2,
    backgroundColor: THEME.COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 18
  },
  cancel: {
    flex: 1,
    marginRight: 2,
    backgroundColor: THEME.COLORS.GREY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  row: {
    backgroundColor: THEME.COLORS.WHITE,
    padding: 10
  }
})

export default styles
