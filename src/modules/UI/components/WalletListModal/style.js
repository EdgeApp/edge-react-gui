import React from 'react-native'
import {Dimensions, StyleSheet} from 'react-native';

module.exports = StyleSheet.create({
    topLevel: {
         zIndex: -1,
         elevation: -1,
         width: 100,
         height: 100,
         paddingTop: 50,
         backgroundColor: 'transparent',
         borderWidth: 1,
         borderColor: 'yellow',
         position: 'absolute',
         top: 50
    },
  modalRoot: {
    paddingTop: 50,
    borderWidth: 1,
    borderColor: 'red'
  },
  modalBody: {
      height: 200,
      width: Dimensions.get('window').width,
      zIndex: -1,
      elevation: -1
  }
})