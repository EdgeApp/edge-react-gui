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
        loose: true,
        // The CLI only runs on Node, which has native classes and spread.
        // Without a target, loose mode compiles `[...set]` to
        // `[].concat(set)`, which yields `[set]` rather than its members, and
        // `transform-fake-error-class` builds error subclasses that fail
        // `instanceof`, so every engine error reached the client as a 500.
        targets: { node: '18' }
      }
    ],
    '@babel/typescript'
  ]
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
