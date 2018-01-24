module.exports =
{
  'extends': [
    'standard',
    'plugin:flowtype/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all'
  ],
  'parser': 'babel-eslint',
  'plugins': ['flowtype', 'standard', 'react', 'react-native'],
  'rules': {
    'camelcase': 'error',
    'flowtype/generic-spacing': 'off',
    'no-throw-literal': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'react/prop-types': 0,
    'react/no-string-refs': 0,
    'react-native/no-unused-styles': 0,
    'react-native/split-platform-components': 2,
    'react-native/no-inline-styles': 0,
    'react/jsx-no-duplicate-props': ['error', { 'ignoreCase': true }],
    'react/jsx-indent-props': ['error', 2],
    'react/self-closing-comp': ['error', {'component': true}],
    'react/no-typos': 'error',
    'react/no-array-index-key': 'error'
  }
}
