import { StyleSheet } from 'react-native'
import Dimensions from 'Dimensions'

const {height, width} = Dimensions.get('window')

export default style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center'
  },

  detailsContainer: {
    margin: 25
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },

  detailText: {
    fontSize: 18,
    marginVertical: 3,
    marginHorizontal: 7
  },

  detailTextLeft: {
    textAlign: 'right',
    width: width * 1 / 3
  },

  detailTextRight: {
 		textAlign: 'left',
    paddingRight: 30,
    width: width * 2 / 3
  },

  text: {
    marginVertical: 10,
    color: '#FFF',
    fontSize: 16
  },

  warning: {
    color: 'yellow'
  },

  button: {
    borderStyle: 'solid',
    borderColor: '#FFF',
    borderWidth: 2,
    backgroundColor: 'rgba(0,0,0,0)',
    justifyContent: 'center',
    width: 100,
    height: 60
  },

  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontSize: 22
  }
})
