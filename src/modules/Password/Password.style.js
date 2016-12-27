import { StyleSheet } from 'react-native'

import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({

  inputView: {
    flex: 1,
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
  passwordValidationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 0
  },
  passwordEye: {
    width: 30,
    height: 30,
    resizeMode: 'contain'
  },
  input: {
    fontSize: 22,
    color: 'skyblue',
    width: 240,
    fontFamily: appTheme.fontFamily
  },

  paragraph: {
    marginBottom: 15,
    marginTop: 30,
    fontSize: 14,
    marginHorizontal: 30,
    fontFamily: appTheme.fontFamily
  }

})
export default style
