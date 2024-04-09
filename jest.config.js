module.exports = {
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx'],
  preset: 'react-native',
  setupFiles: ['./jestSetup.js'],
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@react-native|react-native|react-navigation))']
}
