import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 25,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  exchangeRateAndMax: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  flipInput: {
    flex: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  spacer: {
    flex: 6,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  recipientAndPinInput: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  slider: {
    flex: 2,
    backgroundColor: 'transparent',
  }
})

export default styles
