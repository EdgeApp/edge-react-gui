// The various react-native-reanimated entry points the app uses,
// but resolved to our internal copy of Reanimated 3:
module.exports = {
  // Reanimated itself:
  'react-native-reanimated': require.resolve('react-native-reanimated'),

  // react-native-keyboard-controller reaches into our internals:
  'react-native-reanimated/src/core': require.resolve(
    'react-native-reanimated/src/core.ts'
  ),

  // Some functions like `runOnJs` have moved, so put them back:
  'react-native-worklets': require.resolve('react-native-reanimated')
}
