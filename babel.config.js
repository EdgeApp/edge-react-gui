module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // The react-native preset should have included this, but somehow forgot:
    require('@babel/plugin-transform-export-namespace-from'),
    'react-native-reanimated/plugin'
  ]
}
