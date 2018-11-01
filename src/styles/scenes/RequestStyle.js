// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'

const styles = StyleSheet.create({
  gradient: {
    height: THEME.HEADER
  },
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  main: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 5
  },
  flipInputContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  abQRCodeContainer: {
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  requestStatusContainer: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareButtonsContainer: {
    alignItems: 'stretch',
    justifyContent: 'center'
  }
})

export default styles
