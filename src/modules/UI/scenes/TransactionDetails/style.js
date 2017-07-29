import {StyleSheet} from 'react-native'
import {colors as c} from '../../../../theme/variables/airbitz'

export default StyleSheet.create({

  container: {
    flex: 1,
    alignItems: 'stretch',
    flexDirection: 'column'
  },
  expandedHeader: {
    height: 32,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  modalHeaderIconWrapBottom: {
    borderRadius: 25,
    backgroundColor: 'white',
    height: 50,
    width: 50,
    position: 'relative',
    top: 10
  },
  modalHeaderIconWrapTop: {
    borderRadius: 25,
    backgroundColor: 'white',
    zIndex: 100,
    elevation: 100,
    height: 48,
    width: 48
  },
  payeeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'transparent'
  },
  dataArea: {
    position: 'relative',
    top: 34,
    flexDirection: 'column'
  },
  payeeNameArea: {
    alignItems: 'center',
    flexDirection: 'column'
  },
  payeeNameWrap: {
    width: '80%',
    padding: 4,
    alignItems: 'center'
  },
  payeeNameInput: {
    color: c.gray1,
    fontSize: 17,
    height: 24,
    textAlign: 'center',
    width: '100%'
  },
  payeeSeperator: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    width: '38%',
    height: 1,
    alignSelf: 'center'
  },
  dateWrap: {
    padding: 4,
    alignItems: 'center',
    flexDirection: 'column'
  },
  date: {
    color: c.gray2,
    fontSize: 14
  },
  amountAreaContainer: {
    flexDirection: 'column'
  },
  amountAreaCryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 15,
    paddingRight: 15
  },
  amountAreaLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  amountAreaLeftText: {
    fontSize: 14
  },
  amountAreaMiddle: {
    paddingTop: 18,
    flex: 3,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },
  amountAreaMiddleTop: {
    paddingBottom: 4
  },
  amountAreaMiddleTopText: {
    fontSize: 26,
    color: c.gray1
  },
  amountAreaMiddleBottom: {},
  amountAreaMiddleBottomText: {
    fontSize: 14,
    color: c.gray2
  },
  amountAreaRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  amountAreaRightText: {
    color: c.gray2,
    fontSize: 14
  },
  editableFiatRow: {
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15
  },
  editableFiatLeft: {
    flex: 1
  },
  editableFiatArea: {
    width: '38%',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row'
  },
  fiatSymbol: {

  },
  editableFiat: {
    color: c.gray1,
    fontSize: 17,
    textAlign: 'center',
    height: 26,
    flex: 1
  },
  editableFiatRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  editableFiatRightText: {
    color: c.gray2,
    fontSize: 14
  },
  categoryRow: {
    paddingTop: 15,
    marginTop: 10,
    flexDirection: 'row',
    paddingLeft: 15,
    paddingRight: 15,
    height: 44
  },

  categoryLeft: {
    borderRadius: 3,
    borderWidth: 1,
    padding: 5,
    height: 28
  },
  categoryLeftText: {
    fontSize: 14
  },
  categoryInputArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginLeft: 11,
    height: 27,
    justifyContent: 'center',
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  categoryInput: {
    height: 22,
    fontSize: 13,
    flex: 1,
    color: c.gray1
  },
  notesRow: {
    paddingBottom: 20,
    paddingTop: 14,
    paddingLeft: 15,
    paddingRight: 15
  },
  notesInputWrap: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 3,
    height: 50,
    padding: 3
  },
  notesInput: {
    color: c.gray1,
    fontSize: 12
  },
  footerArea: {
    backgroundColor: c.gray4,
    height: 123,
    paddingTop: 20,
    paddingLeft: 15,
    paddingRight: 15
  },
  buttonArea: {
    height: 50
  },
  saveButton: {
    height: 50
  },
  advancedTxArea: {
    padding: 15,
    paddingBottom: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  advancedTxText: {
    color: c.secondary,
    fontSize: 14
  },

  // subcategory selector
  subCategoryContainer: {
    paddingLeft: 15,
    paddingRight: 15,
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: c.gray3
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
    flexDirection: 'row',
    paddingRight: 20
  },
  rowCategoryTextWrap: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 5
  },
  rowCategoryText: {
    fontSize: 18,
    color: '#58595C'
  },
  rowPlusWrap: {
    justifyContent: 'center'
  },
  rowPlus: {
    fontSize: 16,
    color: '#58595C'
  },

  // beginning of contact search results
  singleContact: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D6D6',
    padding: 10,
    paddingRight: 15,
    paddingLeft: 15
  },
  singleContactWrap: {
    flexDirection: 'column',
    flex: 1
  },
  singleDateArea: {
    backgroundColor: '#f6f6f6',
    flex: 3,
    padding: 8,
    paddingLeft: 15,
    flexDirection: 'row',
    paddingRight: 24
  },
  leftDateArea: {
    flex: 1
  },
  contactInfoWrap: {
    flexDirection: 'row',
    height: 40,
    flex: 1,
    justifyContent: 'space-between'
  },
  contactLeft: {
    flexDirection: 'row'
  },
  contactLogo: {
    width: 40,
    height: 40,
    marginRight: 10
  },
  contactLeftTextWrap: {
    justifyContent: 'center'
  },
  contactName: {
    fontSize: 16,
    color: '#58595C',
    textAlignVertical: 'center'
  },
  contactBitAmount: {
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'center'
  }
})
