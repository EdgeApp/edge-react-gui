import typescript from '@rollup/plugin-typescript'
import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './src/controllers/edgeProvider/client/edgeProviderBridge.ts',
  output: {
    file: './src/controllers/edgeProvider/client/rolledUp.js',
    format: 'iife'
  },
  plugins: [typescript(), resolve()]
}
