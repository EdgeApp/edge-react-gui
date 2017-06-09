import React, {StyleSheet, Dimensions, Platform} from 'react-native'

module.exports = StyleSheet.create({
    unlockRow: {
      padding: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      height: 50
    },
    accountBoxHeaderTextWrap: {
      
    },
    leftArea: {
      flexDirection: 'row'
    },
    userIcon: {
      backgroundColor: 'transparent',
      fontSize: 22
    },
    accountBoxHeaderText: {
      fontSize: 18,
      color: 'white',
      backgroundColor: 'transparent',
      marginLeft: 16
    },
    dropdownIcon: {
      textAlignVertical: 'center',
      alignSelf: 'center',
      height: 24,
      fontSize: 24,
      backgroundColor: 'transparent'
    }
})