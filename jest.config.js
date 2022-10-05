/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  preset: 'react-native',
  coverageDirectory: './coverage',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: ['./jestSetup.js'],

  // Don't run node_modules through Babel, except specific ones that still need it:
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@react-native|react-native|react-navigation))']
}

// Produce junit and cobertura output when on Jenkins:
if (process.env.JEST_JENKINS != null) {
  config.coverageReporters = ['html', 'cobertura']
  config.reporters = ['default', ['jest-junit', { outputDirectory: './coverage' }]]
}

module.exports = config
