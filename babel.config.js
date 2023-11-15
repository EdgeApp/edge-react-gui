module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [require('@babel/plugin-transform-export-namespace-from'), 'react-native-reanimated/plugin']
}
