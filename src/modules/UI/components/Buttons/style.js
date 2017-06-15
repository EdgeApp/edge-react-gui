import React, {StyleSheet, Platform} from 'react-native'  


  module.exports = StyleSheet.create({

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
  },
  doneButton: {
    color: '#3c76cd'
  }  
})