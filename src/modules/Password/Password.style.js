import { StyleSheet } from 'react-native'

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
    width: 240
  },

  paragraph: {
    marginTop: 10,
    fontSize: 14
  }

})
export default style
