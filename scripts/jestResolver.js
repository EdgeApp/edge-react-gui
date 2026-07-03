// Custom jest resolver handling two RN-0.85-ecosystem quirks:
//
// 1. Reanimated 4 splits out react-native-worklets, whose `.native` modules
//    instantiate native code that crashes in jest. Resolve worklets to its
//    non-native build (mirrors react-native-worklets/jest/resolver.js).
//
// 2. The React Native jest preset sets the `react-native` export condition.
//    msw (and @mswjs/*) map their Node exports to `null` under that condition,
//    so `msw/node` fails to resolve. Resolve anything msw-related with Node
//    export conditions (preferring CommonJS) instead.
module.exports = (request, options) => {
  const { defaultResolver } = options

  if (
    options.basedir.includes('react-native-worklets') ||
    request.includes('react-native-worklets')
  ) {
    options = {
      ...options,
      extensions: options.extensions?.filter(ext => !ext.includes('native'))
    }
  }

  const isMsw =
    request === 'msw' ||
    request.startsWith('msw/') ||
    request.startsWith('@mswjs/') ||
    options.basedir.includes('/node_modules/msw') ||
    options.basedir.includes('/node_modules/@mswjs')
  if (isMsw) {
    options = { ...options, conditions: ['node', 'require', 'default'] }
  }

  return defaultResolver(request, options)
}
