module.exports = {
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  moduleNameMapper: {
    // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid'),
    // We want the Node.js version of edge-core-js, not the RN one:
    'edge-core-js': require.resolve('edge-core-js')
  },
  preset: 'react-native',
  setupFiles: ['./jestSetup.js'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@react-native|react-native))']
}
