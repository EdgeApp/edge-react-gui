module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // Transforms `export * as name from '…'`, which the React Native preset
      // does not transform on its own.
      '@babel/plugin-transform-export-namespace-from',
      'react-native-worklets/plugin'
    ]
  }
}
