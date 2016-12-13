import { StyleSheet } from 'react-native'

const style = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5FCFF'
  },

  inputView: {
    flex: 1,
    marginTop: 10,
    marginLeft: 30,
    marginRight: 30,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column'

  },

  inputLabel: {
    fontWeight: 'bold',
    fontSize: 16
  },

  input: {
    width: 200,
    height: 60,
    fontSize: 22,
    color: 'skyblue',
    alignSelf: 'center',
    textAlign: 'center'
  },

  paragraph: {
    marginTop: 10,
    fontSize: 14
  }

})
export default style
