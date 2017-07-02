import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    marginVertical: 30,
    marginHorizontal: 20
  },
  slider: {
    backgroundColor: 'rgba(0,0,0, 0.1)',
    overflow: 'hidden',
    borderRadius: 27,
    height: 55,
  },
  track: {
    // backgroundColor: '#355ea0',
  },
  thumb: {
    width: 52,
    height: 52,
    position: 'absolute',
    bottom: -26,
    backgroundColor: 'white',
    borderRadius: 100,
  }
})

export default styles
