// @flow
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/lib/bridge/bridge.js',
  output: { file: './src/lib/bridge/rolledUp.js', format: 'cjs' },
  plugins: [resolve()]
}
