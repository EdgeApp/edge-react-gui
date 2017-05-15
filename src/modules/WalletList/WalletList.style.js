import React from 'react-native'
import {StyleSheet, Dimensions} from 'react-native';

module.exports = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
  },
    totalBalanceBox: {
      flex: 4,
      justifyContent: "center"
    },

  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  totalBalanceHeader: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  totalBalanceText: {
    fontSize: 24,
    color: 'white'
  },
  currentBalanceBoxDollarsWrap: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  currentBalanceBoxDollars: {
    color: "#FFFFFF",
    fontSize: 36
  },
  currentBalanceBoxBits: {
    color: "#FFFFFF",
    justifyContent: "space-around",
    flex: 1
  },



    //bottom major portion of screen
    walletsBox: {
      flex:8
    },
    walletsBoxHeaderWrap: {
      padding: 12,
      backgroundColor: '#C8C8C8',
      borderBottomWidth: 1,
      borderColor: '#BBB',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    walletsBoxHeaderTextWrap: {

    },
    walletsBoxHeaderText: {
      fontWeight: 'bold',
      fontSize: 18
    },
    walletsBoxHeaderAddWallet: {
  
    },

    archiveBoxHeaderWrap: {
      padding: 12,
      backgroundColor: '#C8C8C8',
      borderBottomWidth: 1,
      borderColor: '#BBB',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    archiveBoxHeaderTextWrap: {

    },
    archiveBoxHeaderText: {
      fontWeight: 'bold',
      fontSize: 18
    },
    archiveBoxHeaderDropdown: {
  
    },

    rowContainer: {
      padding: 16,
      backgroundColor: "#F8F8F8",
      borderBottomWidth: 1,
      borderColor: '#EEE'
    },
    rowContent: {
      justifyContent: 'space-between',
      flexDirection: 'row' 
    },
    rowNameTextWrap: {
      justifyContent: 'center'
    },
    rowNameText: {

    },
    rowDotsWrap: {
      
    },
    rowDots: {

    },
  // modal styles
  modalContainer: {
    flex: 1 ,
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    padding: 10
  },
  modalBox: {
    top: Dimensions.get('window').height /5,
    width: Dimensions.get('window').width * 3 / 4,
    borderRadius: 3,
    alignItems: 'stretch',
    height: (Dimensions.get('window').height) / 4,
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },

  // beginning of rename wallet modal
  modalTopTextWrap: {
    flex: 1
  },
  modalTopText: {
    textAlign: 'center',
    color: '#3c76cd',
    fontWeight: '500'
  },
  modalMiddle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  modalMiddleTextWrap: {

  },
  modalMiddleText: {

  },
  nameInputWrap: {

    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    flex: 1,
    marginBottom: 30    

  },
  nameInput: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center'
  },
  modalBottom: {
    height: 30,
    flexDirection: 'row'
  },
  emptyBottom: {
    flex: 1
  },
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row'
  },
  cancelButtonWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    fontSize: 12,
    color: '#3c76cd'
  },
  doneButtonWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  doneButton: {
    fontSize: 12,
    color: '#3c76cd'
  }       
})
