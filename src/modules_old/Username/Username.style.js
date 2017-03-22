import { StyleSheet } from 'react-native'
import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({

  inputView: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column'
  },

  usernameInput: {
    height: 40,
    width: 260,
    fontSize: 22,
    color: 'skyblue',
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
