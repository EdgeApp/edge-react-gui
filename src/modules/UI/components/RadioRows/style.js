/* eslint-disable flowtype/require-valid-file-annotation */

import { StyleSheet } from 'react-native'

export default StyleSheet.create({
  rowContainer: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'space-around'
  },
  rowTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  rowLeftContainer: {
    justifyContent: 'center'
  },
  rowLeftText: {
    color: '#58595C',
    fontSize: 16
  },
  radioButton: {
    height: 24
  }
})
