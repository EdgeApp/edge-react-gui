import React, {StyleSheet, Dimensions} from 'react-native';

module.exports = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'stretch',
    },
    totalBalanceBox: {//one
      flex: 3,
      justifyContent: "center",
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
    color: "#2A5799",
    fontSize: 44,
    fontFamily: 'SourceSansPro-Light'
  },
  currentBalanceBoxBits: {
    color: "#FFFFFF",
    justifyContent: "space-around",
    flex: 1
  },

    //bottom major portion of screen
    walletsBox: { //one
      flex:9
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
      flexDirection: 'row'
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
      flexDirection: 'row'
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
    
    //beginning of options component
    menuOption: {
      height: 45,
      borderBottomColor: '#D4D4D4',
      borderBottomWidth: 1,
      paddingLeft: 13,
      paddingRight: 13,
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
