const reactNativePreset = require('react-native/jest-preset')

module.exports = {
  moduleNameMapper: {
    // Force module uuid to resolve with the CJS entry point,
    // because Jest does not support package.json.exports.
    // See https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid'),

    // We want the Node.js version of edge-core-js, not the RN one:
    'edge-core-js': require.resolve('edge-core-js')
  },
  preset: 'react-native',
  setupFilesAfterEnv: ['./jestSetup.js'],
  transform: {
    ...reactNativePreset.transform,

    // The React Native preset only lists image and video assets, but we
    // also import fonts (via @expo/vector-icons) and sounds:
    '^.+\\.(aac|m4a|mp3|otf|ttf|wav|woff|woff2)$': require.resolve(
      'react-native/jest/assetFileTransformer.js'
    )
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@react-native|react-native|@react-navigation|@expo/vector-icons|zcashname-sdk|@noble/ed25519))'
  ]
}
