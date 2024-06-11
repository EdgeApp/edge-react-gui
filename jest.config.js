module.exports = {
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  moduleNameMapper: {
    // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
    uuid: require.resolve('uuid')
  },
  preset: 'react-native',
  setupFiles: ['./jestSetup.js'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@react-native|react-native))']
}
