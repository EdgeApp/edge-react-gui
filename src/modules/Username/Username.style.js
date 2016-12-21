import { StyleSheet } from 'react-native'
import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({

  inputView: {
    flex: 1,
    marginLeft: 30,
    marginRight: 30,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },

  usernameInput: {
    height: 60,
    fontSize: 22,
    color: 'skyblue',
    width: 200,
    fontFamily: appTheme.fontFamily
  },

  paragraph: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: appTheme.fontFamily
  }

})

export default style
