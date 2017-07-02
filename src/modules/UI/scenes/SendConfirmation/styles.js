import { StyleSheet } from 'react-native'

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
    alignItems: 'flex-start'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 25
  },
  spacer: {
    flex: 6,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  recipient: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  slider: {
    flex: 2,
    backgroundColor: 'transparent',
  }
})

export default styles
