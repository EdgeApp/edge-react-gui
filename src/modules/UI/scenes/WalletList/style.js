import React, {StyleSheet, Dimensions, Platform} from 'react-native'

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}

console.log('screenDimensions is: ', screenDimensions)

module.exports = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  totalBalanceBox: { // one
    flex: 3,
    justifyContent: 'center'
  },
  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  totalBalanceHeader: {
    flex: 2,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  totalBalanceText: {
    fontSize: 18,
    color: '#2A5799'
  },
  currentBalanceBoxDollarsWrap: {
    flex: 3,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxDollars: {
    color: '#2A5799',
    fontSize: 44
  },
  currentBalanceBoxBits: {
    color: '#FFFFFF',
    justifyContent: 'space-around',
    flex: 1
  },
    // bottom major portion of screen
  walletsBox: { // one
    flex: 9
  },
  walletsBoxHeaderWrap: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  walletsBoxHeaderTextWrap: {
  },
  leftArea: {
    flexDirection: 'row'
  },
  walletIcon: {
    backgroundColor: 'transparent',
    fontSize: 22
  },
  walletsBoxHeaderText: {
    fontSize: 18,
    color: 'white',
    backgroundColor: 'transparent',
    marginLeft: 16
  },
  walletsBoxHeaderAddWallet: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  dropdownIcon: {
    textAlignVertical: 'center',
    alignSelf: 'center',
    height: 24,
    fontSize: 24,
    backgroundColor: 'transparent'
  },
  archiveBoxHeaderWrap: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#BBB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 50
  },
  archiveBoxHeaderTextWrap: {
  },
  archiveIcon: {
    backgroundColor: 'transparent',
    fontSize: 28
  },
  archiveBoxHeaderText: {
    fontSize: 18,
    backgroundColor: 'transparent',
    color: 'white',
    marginLeft: 14
  },
  archiveBoxHeaderDropdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  rowContainer: {
    flex: 1,
    height: 50,
    paddingLeft: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#EEE'
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row'
  },
  rowNameTextWrap: {
    flex: 1,
    justifyContent: 'center'
  },
  rowNameText: {
    color: '#58595C'
  },
  rowBalanceTextWrap: {
    justifyContent: 'center'
  },
  rowBalanceAmountText: {
    color: '#58595C',
    textAlign: 'right'
  },
  rowBalanceDenominationText: {
    color: '#58595C'
  },  
  rowDotsWrap: {
    flexDirection: 'row'
  },
  menuTrigger: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10
  },
    // beginning of options component
  menuOption: {
    borderBottomColor: '#D4D4D4',
    borderBottomWidth: 1,
    justifyContent: 'center'
  },
  menuOptionItem: {
    flexDirection: 'row'
  },
  optionIcon: {
    color: '#58595C',
    marginRight: 10
  },
  optionText: {
    color: '#58595C',
    fontSize: 18
  },
  editIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  trashIcon: {
    marginRight: 13,
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  archive: {
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  nameInputWrap: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    marginTop: 0,
    marginBottom: 0,
    borderBottomColor: '#dddddd',
    borderBottomWidth: (Platform.OS === 'ios') ? 1 : 0

  },
  nameInput: {
    height: (Platform.OS === 'ios') ? 26 : 46,
    textAlign: 'center',
    fontSize: 20
  },
  emptyBottom: {
    flex: 1
  },
  subHeaderSyntax: {
    color: '#58595C',
    textAlign: 'center',
    fontSize: 14
  },
  // buttons
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row',
    alignSelf: 'flex-end'
  },
  stylizedButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: 3
  },
  stylizedButtonTextWrap: {
  },
  stylizedButtonText: {
    color: 'white',
    fontSize: 16
  },
  cancelButtonWrap: {
    backgroundColor: '#909091',
    alignSelf: 'flex-start'
  },
  cancelButton: {
    color: '#3c76cd'
  },
  doneButtonWrap: {
    backgroundColor: '#4977BB',
    alignSelf: 'flex-end',
    marginLeft: 4
  },
  doneButton: {
    color: '#3c76cd'
  },
  // beginning of token rows //
  tokenRowContainer: {
    padding: 16,
    paddingLeft: 30,
    paddingRight: 44,
    backgroundColor: '#F6F6F6',
    borderBottomWidth: 1,
    borderColor: '#EEE'
  },
  tokenRowContent: {
    justifyContent: 'space-between',
    flexDirection: 'row'
  },
  tokenRowNameTextWrap: {
    justifyContent: 'center'
  },
  tokenRowText: {
    color: '#58595C'
  }
    // end of token rows //
})
