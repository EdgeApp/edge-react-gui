import React from 'react-native'
import {StyleSheet} from 'react-native';

module.exports = StyleSheet.create({

  container: {
      flex: 1,
      alignItems: 'stretch',
  },
    totalBalanceBox: {
      flex: 4,
      justifyContent: "center"
    },

  totalBalanceWrap: {
    flex: 3,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  totalBalanceHeader: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent'
  },
  totalBalanceText: {
    fontSize: 24,
    color: 'white'
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
      flex:8
    },
    rowContainer: {
      padding: 18,
      backgroundColor: "#F8F8F8",
      borderBottomWidth:1,
      borderColor: '#eee' 
    },
    rowNameText: {

    }
})
