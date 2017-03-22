import { StyleSheet } from 'react-native'
import appTheme from '../../../Themes/appTheme'
const style = StyleSheet.create({

  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
    padding: 10,
    width: 300
  },

  textError: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: appTheme.fontFamily
  },

  hideModal: {
    fontSize: 16,
    color: 'skyblue',
    textAlign: 'center'
  }
})
export default style
