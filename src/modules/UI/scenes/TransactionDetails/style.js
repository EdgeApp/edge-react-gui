import React, {StyleSheet} from 'react-native'

module.exports = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
      flexDirection: 'column'
  },
  expandedHeader: {
    height: 32,

  },
  modalHeaderIconWrapBottom: {
    borderRadius: 27,
    backgroundColor: 'white', 
    height: 54, 
    width: 54    
  },
  modalHeaderIconWrapTop: {
    position: 'relative', 
    top: 3, 
    left: 3, 
    borderRadius: 27, 
    backgroundColor: 'white', 
    zIndex: 100, 
    elevation: 100,
    height: 48, 
    width: 48
  }  

});