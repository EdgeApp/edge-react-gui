module.exports = {
  dependencies: {
    'react-native-custom-tabs': {
      platforms: {
        ios: null
      }
    }
  },
  project: {
    android: {
      unstable_reactLegacyComponentNames: [
        'EdgeCoreWebView'
        // list of conponents that needs to be wrapped by the interop layer
      ]
    },
    ios: {
      unstable_reactLegacyComponentNames: [
        'BVLinearGradient',
        'EdgeCoreWebView'
        // list of conponents that needs to be wrapped by the interop layer
      ]
    }
  }
}
