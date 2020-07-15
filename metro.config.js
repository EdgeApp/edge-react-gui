// @flow
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 */

const extraNodeModules = require('node-libs-react-native')
extraNodeModules.vm = require.resolve('vm-browserify')

module.exports = {
  resolver: {
    extraNodeModules
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false
      }
    })
  }
}
