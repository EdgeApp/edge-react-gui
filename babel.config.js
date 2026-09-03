module.exports = function (api) {
  const isAndroid = api.caller(c => c.platform === 'android')

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      // `typechain` emits `export * as factories from './factories'` in
      // src/plugins/contracts, which the React Native preset does not
      // transform on its own.
      '@babel/plugin-transform-export-namespace-from',
      isAndroid
        ? './node_modules/r3-hack/node_modules/react-native-reanimated/plugin'
        : 'react-native-worklets/plugin'
    ]
  }
}
