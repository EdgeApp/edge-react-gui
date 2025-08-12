module.exports = {
  dependencies: {
    'react-native-custom-tabs': {
      platforms: {
        ios: null
      }
    },
    // Accountbased pulls this in, but we don't use it natively:
    '@fioprotocol/fiosdk': {
      platforms: {
        android: null,
        ios: null
      }
    }
  }
}
