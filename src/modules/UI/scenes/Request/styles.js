import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    padding: 5,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  main: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 10
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
    alignItems: 'center',
    justifyContent: 'center'
  },
  shareButtons: {
    flex: 1
  }
})

export default styles
