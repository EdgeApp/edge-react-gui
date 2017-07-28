import React, {StyleSheet} from 'react-native'
import {colors as c} from '../../../../theme/variables/airbitz'

module.exports = StyleSheet.create({

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
    padding: 6,
    alignItems: 'center'
  },
  payeeNameInput: {
    color: c.gray1,
    fontSize: 17,
    height: 20,
    textAlign: 'center',
    width: '100%'
  },
  payeeSeperator: {
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    width: '38%',    
    height: 1
  },
  dateWrap: {
    padding: 4
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
  amountAreaMiddleBottom: {

  },
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
    fontSize: 14,   
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
    alignItems: 'center'
  },
  editableFiat: {
    color: c.gray1,
    fontSize: 17,
    textAlign: 'center',
    height: 36
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
    marginTop: 10,
    flexDirection: 'row', 
    paddingLeft: 15,
    paddingRight: 15    
  },

  exchange: {
    color: c.accentOrange,
    borderColor: c.accentOrange
  },
  expense: {
    color: c.secondary,
    borderColor: c.secondary
  },
  transfer: {
    color: c.primary,
    borderColor: c.primary
  },
  receive: {
    color: c.accentGreen,
    borderColor: c.accentGreen
  },

  categoryLeft: {
    borderRadius: 3,
    borderWidth: 1,
    padding: 6
  },
  categoryInputArea: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    marginLeft: 11,
    height: 27,
    justifyContent: 'center',
    alignItems: 'flex-start',

  },
  categoryInput: {
    height: 16,
    fontSize: 13,

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
  }
});

