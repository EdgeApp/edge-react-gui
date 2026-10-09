/**
 * The EdgeProvider shim bundle, injected into the in-app browser.
 *
 * `@rollup/plugin-node-resolve`, the same plugin `rollup.config.cli.mjs`
 * uses: this config was on `rollup-plugin-node-resolve`, the pre-scope name
 * twelve majors behind, so the repository carried two packages doing one job
 * for its two rollup builds.
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
