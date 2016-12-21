import { StyleSheet } from 'react-native'

import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5FCFF'
  },

  inputView: {
    flex: 1,
    marginTop: 10,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column'

  },

  inputLabel: {
    marginHorizontal: 30,

    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: appTheme.fontFamily
  },

  input: {
    marginHorizontal: 30,

    width: 200,
    height: 60,
    fontSize: 22,
    color: 'skyblue',
    alignSelf: 'center',
    textAlign: 'center',
    fontFamily: appTheme.fontFamily
  },

  paragraph: {
    marginHorizontal: 30,
    
    marginTop: 10,
    fontSize: 14,
    fontFamily: appTheme.fontFamily
  }

})
export default style
