import React from 'react-native'
import {Dimensions, StyleSheet} from 'react-native';

module.exports = StyleSheet.create({
  topLevel: { 
    zIndex: 10,
      width: Dimensions.get('window').width,
      backgroundColor: 'white',
      alignSelf: 'stretch'
  },
  modalRoot: {
    paddingTop: 50,
  },
  headerContainer: {
    backgroundColor: '#5c5d5f',  
  },
  modalBody: {
    width: Dimensions.get('window').width,
    zIndex: 4,
  },
  rowContainer: {
    backgroundColor: 'white',    
    padding: 16,
    justifyContent: 'space-between',      
  },
  rowNameText: {
    fontSize: 14
  },
  headerContent: {
    justifyContent: 'space-between',
    flexDirection: 'row' 
  },
  headerTextWrap: {
    justifyContent: 'center'
  },  
  headerText: {
    color: 'white',
    fontSize: 14
  },
  headerCloseWrap: {
    alignSelf: 'flex-end'
  },
  modalCloseWrap: {

  },
  modalClose: {
    width: 20
  },
  
  // beginning of token rows //
  tokenRowContainer: {
    padding: 16,
    paddingLeft: 30,
    backgroundColor: "#F6F6F6",
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
  tokenRowNameText: {
    color: '#58595C'
  },
    // end of token rows //    
})