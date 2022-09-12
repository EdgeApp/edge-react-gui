import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'react-native',
  coverageDirectory: './coverage',
  setupFiles: ['./jestSetup.js'],
  verbose: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.spec.json'
      }
    ]
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Ignore tests in the e2e folder:
  testPathIgnorePatterns: ['<rootDir>/node_modules', '<rootDir>/e2e', '<rootDir>/src/__tests__'],

  // Don't run node_modules through Babel, except specific ones that still need it:
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!(@react-native|react-native|react-navigation))']
}

// Produce junit and cobertura output when on Jenkins:
if (process.env.JEST_JENKINS != null) {
  config.coverageReporters = ['html', 'cobertura']
  config.reporters = ['default', ['jest-junit', { outputDirectory: './coverage' }]]
}

export default config
