import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    alignSelf: 'stretch'
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 13
  },
  primaryTextInput: {
    flex: 1,
    fontSize: 42,
    textAlign: 'center',
    color: '#FFF'
  },
  icon: {
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 20
  },
  currency: {
    backgroundColor: 'transparent',
    color: '#FFF',
    paddingBottom: 8,
    fontSize: 16,
    paddingHorizontal: 20
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
  secondaryRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 20,
    color: "#FFF",
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  primaryRow: {
    flex: 1,
    flexDirection: 'row'
  },
  leftSpacer: {
    flex: 0.5
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
    color: 'white',
    fontSize: 15
  },
  secondaryFee: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end'
  },
  secondaryFeeText: {
    color: 'white'
  },
})

export default styles
