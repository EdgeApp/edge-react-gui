// @flow
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/util/bridge/bridge.js',
  output: { file: './src/util/bridge/rolledUp.js', format: 'cjs' },
  plugins: [resolve()]
}
