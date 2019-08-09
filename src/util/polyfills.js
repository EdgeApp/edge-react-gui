/* eslint-disable flowtype/require-valid-file-annotation */
/* global __DEV__ */

// In production mode, `process.env.NODE_ENV` starts out as "production",
// but react-native-tcp stomps it to `undefined`.
// At this point, however, libraries have already compiled out
// their debugging code in response to `processs.env.NODE_ENV` being
// "production", but now they try to call this non-existing debug code.
// To prevent this, we need to put the variable back to where it was
// before the stomp:
process.env['NODE_ENV'] = __DEV__ ? 'development' : 'production'

if (!Uint8Array.prototype.slice) {
  // eslint-disable-next-line
  Object.defineProperty(Uint8Array.prototype, 'slice', {
    value: Array.prototype.slice
  })
}
