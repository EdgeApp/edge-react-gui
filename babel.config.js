module.exports = function (api) {
  const isAndroid = api.caller(c => c.platform === 'android')

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      isAndroid
        ? './node_modules/r3-hack/node_modules/react-native-reanimated/plugin'
        : 'react-native-worklets/plugin'
    ]
  }
}
