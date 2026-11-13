/**
 * The EdgeProvider shim bundle, injected into the in-app browser.
 *
 * It resolves with `@rollup/plugin-node-resolve`, the same plugin
 * `rollup.config.cli.mjs` uses, so the repository's two rollup builds share
 * one resolver package.
 */
import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'

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
  plugins: [nodeResolve({ extensions }), babel(babelOpts)]
}
