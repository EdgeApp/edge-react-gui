/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  preset: 'react-native',
  coverageDirectory: './coverage',
  setupFiles: ['./jestSetup.js'],

  // Ignore tests in the e2e folder:
  testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/e2e', '<rootDir>/index.test.js'],

  // Don't run node_modules through Babel, except specific ones that still need it:
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@react-native|react-native|cavy|react-navigation))']
}

// Produce junit and cobertura output when on Jenkins:
if (process.env.JEST_JENKINS != null) {
  config.coverageReporters = ['html', 'cobertura']
  config.reporters = ['default', ['jest-junit', { outputDirectory: './coverage' }]]
}

module.exports = config
