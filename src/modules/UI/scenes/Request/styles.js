import {StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch'
  },
  main: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 20
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
