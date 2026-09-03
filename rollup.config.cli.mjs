import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'
import resolve from '@rollup/plugin-node-resolve'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const packageJson = require('./package.json')

const extensions = ['.ts']
const babelOpts = {
  babelHelpers: 'bundled',
  babelrc: false,
  configFile: false,
  extensions,
  include: ['src/**/*'],
  presets: [
    [
      '@babel/preset-env',
      {
        exclude: ['transform-regenerator'],
        loose: true
      }
    ],
    '@babel/typescript'
  ],
  plugins: ['transform-fake-error-class']
}
const resolveOpts = { extensions }

const external = [
  'buffer',
  'child_process',
  'crypto',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'readline',
  ...Object.keys(packageJson.dependencies)
]

export default [
  {
    external,
    input: 'src/cli/index.ts',
    output: {
      banner: '#!/usr/bin/env node',
      file: 'lib/edgeCli.js',
      format: 'cjs'
    },
    plugins: [json(), babel(babelOpts), resolve(resolveOpts)]
  },
  {
    external,
    input: 'src/cli/engine/index.ts',
    output: {
      banner: '#!/usr/bin/env node',
      file: 'lib/edgeEngine.js',
      format: 'cjs'
    },
    plugins: [json(), babel(babelOpts), resolve(resolveOpts)]
  }
]
