// @flow

const path = require('path')
/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

module.exports = {
  resolver: {
    extraNodeModules: {
      // NodeJS Shims
      crypto: path.resolve(__dirname, 'node_modules/crypto-browserify'),
      http: path.resolve(__dirname, 'node_modules/stream-http'),
      https: path.resolve(__dirname, 'node_modules/https-browserify'),
      os: path.resolve(__dirname, 'node_modules/os-browserify'),
      stream: path.resolve(__dirname, 'node_modules/stream-browserify')
    }
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true
      }
    })
  }
}
