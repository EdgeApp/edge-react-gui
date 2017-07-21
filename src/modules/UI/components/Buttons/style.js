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

  primaryButtonWrap: {
    backgroundColor: '#4977BB',
  },
  primaryButton: {
    color: '#3c76cd'
  },

  secondaryButtonWrap: {
    backgroundColor: '#909091',
    alignSelf: 'flex-start'
  },
  secondaryButton: {
    color: '#3c76cd'
  },

  tertiaryButtonWrap: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4977BB'
  },
  tertiaryButton: {
    color: '#4977BB',
    paddingHorizontal: 10
  }
})
