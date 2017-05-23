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
    borderWidth: 1,
    borderColor: 'red'
  },
  headerContainer: {
    height: 44,
    backgroundColor: '#5c5d5f'
  },
  modalBody: {
      width: Dimensions.get('window').width,
      zIndex: 4,
    },
      rowContainer: {
      backgroundColor: 'white',
      height: 44,      
      padding: 16,
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
})