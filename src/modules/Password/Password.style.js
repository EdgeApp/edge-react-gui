import { StyleSheet } from 'react-native'

import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({

  inputView: {
    flex: 1,
    marginTop: 10,
    marginLeft: 30,
    marginRight: 30,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column'

  },
  inputContainer: {
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    flex: 1
  },
  input: {
    height: 60,
    fontSize: 22,
    color: 'skyblue',
    width: 240,
    fontFamily: appTheme.fontFamily
  },

  paragraph: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: appTheme.fontFamily
  }

})
export default style
