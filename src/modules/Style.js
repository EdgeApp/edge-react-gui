import { StyleSheet } from 'react-native'
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
    fontFamily: 'lato'
  },
  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF',
    fontFamily: 'lato'
  },

  backgroundImage: {
    flex: 1,
    width: null,
    height: null,
    resizeMode: 'cover',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  logoContainer: {
    flex: 0.2,
    flexDirection: 'column',
    marginVertical: 15
  },
  logoImage: {
    flex: 1,
    resizeMode: 'contain'
  },

  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#80C342',
    height: 45,
    marginVertical: 3
  },
  buttonText: {
    fontFamily: 'lato',
    textAlign: 'center',
    color: '#FFF',
    fontSize: 18,
    flex: 1
  },
  text: {
    fontSize: 15,
    color: '#CCC',
    fontFamily: 'lato'
  }

})
export default style
