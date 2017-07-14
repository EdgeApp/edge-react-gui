import { StyleSheet } from 'react-native'

const sideWidth = 80;

const styles = StyleSheet.create({

  // Main Flip Input Styles
  view: {
    // flex: 1,
    marginBottom: 20,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    alignSelf: 'stretch'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  icon: {
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.6)',
    width: sideWidth,
    textAlign: 'center'
  },
  currency: {
    backgroundColor: 'transparent',
    color: '#FFF',
    fontSize: 16,
    width: sideWidth,
    textAlign: 'center'
  },
  fees: {
    backgroundColor: 'transparent',
    color: '#FFF',
    fontSize: 14,
    width: sideWidth,
    textAlign: 'center'
  },

  // Main Input Styles
  mainInputRow: {
    flexDirection: 'row'
  },
  primaryInputContainer: {
    flex: 1,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.6)'
  },
  primaryInput: {
    fontSize: 42,
    height: 42,
    textAlign: 'center'
  },

  // Converted Input Styles
  convertedInputRow: {
    flexDirection: 'row',
    paddingTop: 5
  },
  secondaryTextContainer: {
    flex: 1
  },
  secondaryText: {
    fontSize: 20,
    color: "#FFF",
    textAlign: 'center',
    backgroundColor: 'transparent',
  }

  // primaryFee: {
  //   flex: 1,
  //   justifyContent: 'center',
  //   alignItems: 'flex-end'
  // },
  // primaryFeeText: {
  //   color: 'white',
  //   fontSize: 15
  // }
})

export default styles
