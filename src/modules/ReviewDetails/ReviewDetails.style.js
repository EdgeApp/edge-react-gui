import { StyleSheet } from 'react-native'

import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center'
  },

  detailsContainer: {
    margin: 25,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },

  detailText: {
    fontSize: 18,
    marginVertical: 3,
    marginHorizontal: 7,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start'

  },

  detailTextLeft: {
    textAlign: 'right',
    flex: 0.50,
    fontFamily: appTheme.fontFamily
  },

  detailTextRight: {
    textAlign: 'left',
    paddingRight: 30,
    flex: 0.50,
    fontFamily: appTheme.fontFamily
  },

  text: {
    marginVertical: 10,
    color: '#FFF',
    fontSize: 16,
    fontFamily: appTheme.fontFamily
  },

  warning: {
    color: 'yellow',
    fontFamily: appTheme.fontFamily
  },

  button: {
    borderStyle: 'solid',
    borderColor: '#FFF',
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'center',
    width: 100,
    height: 60
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 22,
    fontFamily: appTheme.fontFamily
  }
})
export default style
