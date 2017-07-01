import React, {StyleSheet} from 'react-native'


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
    position: 'relative', 
    top: 1, 
    left: 1, 
    borderRadius: 25, 
    backgroundColor: 'white', 
    zIndex: 100, 
    elevation: 100,
    height: 48, 
    width: 48
  },
  payeeIcon: {
    position: 'relative', 
    top: 2, 
    left: 16, 
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
    width: '38%',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    padding: 6,
    alignItems: 'center'
  },
  payeeNameText: {
    color: '#58595C',
    fontSize: 17
  },
  dateWrap: {
    padding: 4
  },
  date: {
    color: '#909091',
    fontSize: 14
  },
  amountAreaContainer: {
    flexDirection: 'column'
  },
  amountAreaCryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  amountAreaLeft: {

    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  amountAreaLeftText: {
    fontSize: 14
  },
  amountAreaMiddle: {

    justifyContent: 'center',
    alignItems: 'center'
  },
  amountAreaMiddleTop: {

  },
  amountAreaMiddleTopText: {
    fontSize: 26,
    color: '#58595C'
  },
  amountAreaMiddleBottom: {

  },
  amountAreaMiddleBottomText: {
    fontSize: 14,
    color: '#909091'
  },
  amountAreaRight: {
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  amountAreaRightText: {
    color: '#909091',
    fontSize: 14
  },
  editableFiatRow: {

  },
  editableFiatArea: {

  },
  editableFiat: {

  },
  categoryRow: {

  },
  categoryLeft: {

  },
  categoryInputArea: {

  },
  footerArea: {

  },
  buttonArea: {

  },



});

