import React, {StyleSheet, Dimensions, Platform} from 'react-native';

const screenDimensions = {
  height: Dimensions.get('window').height,
  width: Dimensions.get('window').width
}

console.log('screenDimensions is: ', screenDimensions)

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

  nameInputWrap: {
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    marginTop: 16,   
    marginBottom: 16,
    borderBottomColor: '#dddddd',
    borderBottomWidth: (Platform.OS === 'ios') ? 1 : 0         

  },
  nameInput: {
    height: (Platform.OS === 'ios') ? 26 : '100%',
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

  //buttons
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
    fontSize: 16,    
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
  }       
})
