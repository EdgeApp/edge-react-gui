module.exports = {
  dependencies: {
    'react-native-custom-tabs': {
      platforms: {
        ios: null
      }
    },

    // We want Reanimated 3 on Android:
    'react-native-reanimated': {
      platforms: {
        android: {
          sourceDir:
            '../node_modules/r3-hack/node_modules/react-native-reanimated/android'
        }
      }
    },

    // We don't want Reanimated 4 worklets on Android:
    'react-native-worklets': {
      platforms: {
        android: null
      }
    }
  }
}
