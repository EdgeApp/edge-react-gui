if (!Uint8Array.prototype.slice) {
  Object.defineProperty(Uint8Array.prototype, 'slice', {
    value: Array.prototype.slice
  })
}

// try {
//   require('core-js/library/es5')
// } catch (e) {
//   console.log(e)
// }
