import { StyleSheet } from 'react-native'
import appTheme from '../../Themes/appTheme'
const style = StyleSheet.create({

  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  spacer: {
    flex: 0.15
  },
  form: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.7
  },
  horizontalSpacer: {
    flex: 0.25
  },
  inputGroup: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginVertical: 3,
    padding: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: 4,
    borderColor: '#888'
  },

  input: {
    color: '#FFF',
    fontSize: 14,
    fontFamily: appTheme.fontFamily
  },
  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF',
    fontFamily: appTheme.fontFamily
  },
  whiteTransitionFade: {
    position: 'absolute',
    backgroundColor: '#FFF',
    opacity: 1,
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  },

  backgroundImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: '#000'
  },
  logoContainer: {
    flex: 0.25,
    flexDirection: 'column',
    marginBottom: 15,
    marginTop: 30
  },
  logoImage: {
    flex: 1,
    resizeMode: 'contain'
  },
  fieldsView: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#80C342',
    height: 45,
    marginVertical: 10,
    borderRadius: 4
  },
  buttonText: {
    fontFamily: appTheme.fontFamily,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    flex: 1
  },
  textTitle: {
    fontSize: 22,
    color: '#FFF',
    fontFamily: appTheme.fontFamily,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0)'
  },
  text: {
    fontSize: 15,
    color: '#CCC',
    fontFamily: appTheme.fontFamily
  },
  loadingModal: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0)',
    flex: 1
  },

  loadingMessage: {
    color: '#FFF',
    fontSize: 22,
    fontFamily: appTheme.fontFamily,
    marginBottom: 30,
    textAlign: 'center'
  }

})
export default style
