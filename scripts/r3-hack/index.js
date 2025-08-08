// The various react-native-reanimated entry points the app uses,
// but resolved to our internal copy of Reanimated 3:
module.exports = {
  'react-native-reanimated': require.resolve('react-native-reanimated'),
  'react-native-reanimated/src/core': require.resolve(
    'react-native-reanimated/src/core.ts'
  )
}
