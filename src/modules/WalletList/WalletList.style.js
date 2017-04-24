import React from 'react-native'
import {StyleSheet} from 'react-native';

module.exports = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
  },
    totalBalanceBox: {
      flex: 5,
      justifyContent: "center"
    },

  currentBalanceBox: {
    flex: 5,
    justifyContent: "center"
  },
  currentBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  bitcoinIconWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
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
      flex:7
    }
})
