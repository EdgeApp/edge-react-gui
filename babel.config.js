module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // `typechain` emits `export * as factories from './factories'` in
      // src/plugins/contracts, which the React Native preset does not
      // transform on its own.
      '@babel/plugin-transform-export-namespace-from',
      'react-native-worklets/plugin'
    ]
  }
}
