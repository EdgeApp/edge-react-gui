import babel from '@rollup/plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

const extensions = ['.ts']
const babelOpts = {
  babelHelpers: 'bundled',
  babelrc: false,
  configFile: false,
  extensions,
  presets: ['@babel/preset-env', '@babel/preset-typescript']
}

export default {
  input: './src/controllers/edgeProvider/client/edgeProviderBridge.ts',
  output: {
    file: './src/controllers/edgeProvider/client/rolledUp.js',
    format: 'iife'
  },
  plugins: [resolve({ extensions }), babel(babelOpts)]
}
