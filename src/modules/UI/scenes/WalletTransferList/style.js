import React from 'react-native'
import {StyleSheet, Dimensions} from 'react-native'

module.exports = StyleSheet.create({

  container: {
    bottom: Dimensions.get('window').height / 10,
    maxHeight: Dimensions.get('window').height * 0.8,
    alignItems: 'stretch',
    backgroundColor: 'white'
  },
  headerRowWrap: {
    height: 50,
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: '#dddddd',
    borderBottomColor: '#666666',
    borderBottomWidth: 1
  },
  headerTextWrap: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  headerText: {
    color: '#666666',
    fontSize: 20
  },
  exitIconWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },

  individualRowWrap: {
    paddingLeft: 20,
    height: 50,
    borderColor: '#666666',
    borderWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
    alignContent: 'flex-start'
  },
  individualRowText: {
    fontSize: 16
  }

})
