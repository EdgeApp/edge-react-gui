// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform.js'

const styles = StyleSheet.create({
  container: {
    bottom: PLATFORM.deviceHeight / 10,
    maxHeight: PLATFORM.deviceHeight * 0.8,
    alignItems: 'stretch',
    backgroundColor: THEME.COLORS.WHITE
  },
  headerRowWrap: {
    height: 50,
    justifyContent: 'center',
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: THEME.COLORS.GRAY_3,
    borderBottomColor: THEME.COLORS.GRAY_1,
    borderBottomWidth: 1
  },
  headerTextWrap: {
    flex: 5,
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  headerText: {
    color: THEME.COLORS.GRAY_1,
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
    borderColor: THEME.COLORS.GRAY_1,
    borderWidth: 1,
    borderTopWidth: 0,
    justifyContent: 'center',
    alignContent: 'flex-start'
  },
  individualRowText: {
    fontSize: 16
  }
})

export default styles
