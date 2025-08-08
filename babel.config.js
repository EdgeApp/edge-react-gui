module.exports = function (api) {
  const isAndroid = api.caller(c => c.platform === 'android')

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      isAndroid
        ? './node_modules/r3-hack/node_modules/react-native-reanimated/plugin'
        : 'react-native-worklets/plugin'
    ]
  }
}
