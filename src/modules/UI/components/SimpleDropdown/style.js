// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../theme/variables/airbitz.js'

export const rawStyle = {
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    backgroundColor: THEME.COLORS.PRIMARY,
    position: 'absolute',
    zIndex: 9
  },
  touchableContainer: {
    width: '100%'
  },
  sideGap: {
    width: 22
  },
  icon: {
    color: THEME.COLORS.WHITE,
    width: 22,
    height: 22
  },
  touchableInterior: {
    width: '100%',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
}

export default StyleSheet.create(rawStyle)
