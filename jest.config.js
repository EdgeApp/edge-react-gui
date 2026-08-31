module.exports = {
  moduleNameMapper: {
    // Force module uuid to resolve with the CJS entry point,
    // because Jest does not support package.json.exports.
    // See https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid'),

    // We want the Node.js version of edge-core-js, not the RN one:
    'edge-core-js': require.resolve('edge-core-js'),

    // GUI imports @expo/vector-icons; tests keep the RNVI renderer so
    // snapshots stay stable. Native/web still resolve the Expo package.
    '^@expo/vector-icons$': 'react-native-vector-icons',
    '^@expo/vector-icons/(.*)$': 'react-native-vector-icons/$1'
  },
  preset: 'react-native',
  setupFilesAfterEnv: ['./jestSetup.js'],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!(@react-native|react-native|@react-navigation|zcashname-sdk|@noble/ed25519))'
  ]
}
