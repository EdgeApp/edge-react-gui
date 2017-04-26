import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row'
  },
  over: {
    color: 'red'
  },
  max: {
    color: 'orange'
  },
  under: {
    color: 'white'
  },
  primaryTextInput: {
    flex: 3,
    textAlign: 'center',
    fontSize: 30,
    color: 'white'
  },
  secondaryText: {
    flex: 3,
    textAlign: 'center',
    justifyContent: 'center',
    padding: 0,
    color: 'white',
    backgroundColor: 'transparent',
    paddingTop: 15
  },
  primaryRow: {
    flex: 2,
    flexDirection: 'row'
  },
  secondaryRow: {
    flex: 1,
    flexDirection: 'row'
  },
  leftSpacer: {
    flex: 0.5
  },
  iconContainer: {
    flex: 2,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  icon: {
    color: 'white'
  },
  verticalSpacer: {
    flex: 1
  },
  right: {
    flex: 1
  },
  primaryFee: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  primaryFeeText: {
    color: 'white'
  },
  secondaryFee: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  secondaryFeeText: {
    color: 'white'
  },
  row: {
    flex: 5,
    flexDirection: 'row'
  }
})

export default styles
