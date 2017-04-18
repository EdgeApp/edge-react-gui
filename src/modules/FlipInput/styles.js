import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexDirection: 'row'
  },
  over: {
    color: 'red',
  },
  max: {
    color: 'orange',
  },
  under: {
    color: 'white'
  },
  primaryTextInput: {
    flex: 3,
    textAlign: 'center',
    fontSize: 30,
    color: 'white',
  },
  secondaryTextInput: {
    flex: 3,
    textAlign: 'center',
    justifyContent: 'center',
    padding: 0,
    color: 'white',
    backgroundColor: 'transparent',
    paddingTop: 15,
  },
  topRow: {
    flex: 2,
    flexDirection: 'row'
  },
  bottomRow: {
    flex: 1,
    flexDirection: 'row',
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
  topFee: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  topFeeText: {
    color: 'white',
  },
  bottomFee: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  bottomFeeText: {
    color: 'white',
  },
  row: {
    flex: 5,
    flexDirection: 'row',
  }
})

export default styles
