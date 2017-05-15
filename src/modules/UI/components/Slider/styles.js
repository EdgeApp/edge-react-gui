import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  slider: {
    flex: 1,
    marginVertical: 5,
    backgroundColor: '#355ea0',
    overflow: 'hidden',
    borderRadius: 2,
  },
  track: {
    backgroundColor: '#355ea0',
  },
  thumb: {
    width: 50,
    height: 100,
    position: 'absolute',
    bottom: -75,
    backgroundColor: 'white',
  }
})

export default styles
