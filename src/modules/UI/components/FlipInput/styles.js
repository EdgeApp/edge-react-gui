import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({

  // Main Flip Input Styles
  dev: {
    borderColor: 'red',
    borderWidth: 1
  },
  container: {
    flex: 1,
    margin: 20,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    flexDirection: 'row'
  },
  flipButton: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  flipIcon: {
    color: 'rgba(255,255,255,0.6)'
  },
  spacer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  rows: {
    flex: 8,
    flexDirection: 'column',
    backgroundColor: 'transparent'
  }
})

export const top = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1
  },
  symbol: {
    flex: 1,
    fontSize: 15,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
  amount: {
    flex: 4,
    fontSize: 40,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
  currencyCode: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    textAlign: 'right',
    marginRight: 5,
    backgroundColor: 'transparent'
  }
})

export const bottom = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  symbol: {
    flex: 1,
    fontSize: 10,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
  amount: {
    fontSize: 10,
    flex: 4,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'transparent'
  },
  currencyCode: {
    flex: 1,
    fontSize: 10,
    color: 'white',
    textAlign: 'right',
    marginRight: 5,
    backgroundColor: 'transparent'
  }
})
