import {StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch'
  },
  mainScrollView: {
    flex: 1
  },
  main: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  exchangeRateContainer: {
    alignItems: 'center',
    marginVertical: 15
  },
  recipient: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  pendingSymbolArea: {
    height: 12
  },
  slider: {
    backgroundColor: 'transparent'
  },
  error: {
    flex: 1,
    color: 'red',
    textAlign: 'left',
    marginRight: 5,
    backgroundColor: 'transparent'
  }
})

export default styles
