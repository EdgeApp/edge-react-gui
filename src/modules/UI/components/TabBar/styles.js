import {StyleSheet} from 'react-native'
import {colors as c} from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  container: {
    backgroundColor: '#FFF'
  },
  text: {
    alignSelf: 'center',
    marginBottom: 7,
  },
  mb: {
    marginBottom: 15
  },
  buttonText: {
    fontSize: 10,
    color: c.gray1
  },
  activeButton: {
    color: c.primary
  }
})
