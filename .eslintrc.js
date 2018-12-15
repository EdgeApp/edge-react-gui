module.exports = {
  extends: ['standard', 'plugin:flowtype/recommended', 'plugin:react/recommended', 'plugin:react-native/all'],
  settings: {
    react: {
      pragma: 'React', // Pragma to use, default to 'React'
      version: '16.4.1', // React version, default to the latest React stable release
      flowVersion: '0.66' // Flow version
    }
  },
  globals: {
    fetch: true
  },
  parser: 'babel-eslint',
  plugins: ['flowtype', 'standard', 'react', 'react-native'],
  rules: {
    camelcase: 'warn',
    'flowtype/generic-spacing': 'off',
    'flowtype/require-valid-file-annotation': [2, 'always'],
    'flowtype/semi': [2, 'never'],
    'no-throw-literal': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'react-native/no-inline-styles': 0,
    'react-native/no-unused-styles': 0,
    'react-native/split-platform-components': 2,
    'react/jsx-indent-props': ['error', 2],
    'react/jsx-no-duplicate-props': ['error', { ignoreCase: true }],
    'react/no-array-index-key': 'error',
    'react/no-string-refs': 0,
    'react/no-typos': 'error',
    'react/prop-types': 0,
    'react/self-closing-comp': ['error', { component: true }],
    'react-native/no-raw-text': ['error', { skip: ['FormattedText', 'T'] }]
  }
}
