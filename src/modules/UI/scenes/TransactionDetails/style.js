import React, {StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  container: {
      flex: 1,
      alignItems: 'stretch',
      flexDirection: 'column'
  },
  expandedHeader: {
    height: 32,
    //flexDirection: 'row',
    //justifyContent: 'center'
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
  }
})