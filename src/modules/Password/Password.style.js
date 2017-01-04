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
    height: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  passwordEye: {
    width: 30,
    height: 30,
    resizeMode: 'contain'
  },
  input: {
    height: 40,
    fontSize: 22,
    color: 'skyblue',
    width: 240,
    fontFamily: appTheme.fontFamily
  },

  paragraph: {
    marginBottom: 20,
    marginTop: 30,
    fontSize: 14,
    marginHorizontal: 30,
    fontFamily: appTheme.fontFamily
  },
  validationOuterContainer: {
    paddingHorizontal: 10,
    flexGrow: 1,
    flex: 1,
    backgroundColor: '#2291CF',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  passwordCheckmark: {
    height: 15,
    width: 15,
    marginRight: 5
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: appTheme.fontFamily
  },

  textLead: {
    marginVertical: 5,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: appTheme.fontFamily
  }

})
export default style
