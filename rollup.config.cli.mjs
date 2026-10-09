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
        // The CLI bundle runs on Node, so target Node rather than downlevelling
        // for browsers. `loose: true` compiled `[...aSet]` to
        // `[].concat(aSet)`, which wraps the Set instead of spreading it — the
        // built engine then iterated the Set object itself and died on the
        // first event. Targeting Node 18 leaves spread native.
        targets: { node: '18' },
        exclude: ['transform-regenerator']
      }
    ],
    '@babel/typescript'
  ],
  // No Babel plugins. In particular not `transform-fake-error-class`, which
  // rewrites `class X extends Error` into a function returning a plain Error
  // — its own README notes that makes `instanceof X` always false, and the
  // engine and client both dispatch on `instanceof EngineError`,
  // `ApiClientError` and `UsageError`. This bundle targets Node 18, where
  // native subclasses work and give good stack traces. (The repo does not
  // depend on that plugin at all; it was declared and never used.)
  plugins: []
}
const resolveOpts = { extensions }

// Node builtins, plus whatever `package.json` calls a runtime dependency.
//
// That second part is why a CLI-only package belongs in `devDependencies`:
// listed as a dependency it is left out of the bundle and has to be installed
// alongside it, which also puts it in the React Native app's runtime graph for
// nothing. `nanocolors` is therefore a dev dependency and is bundled.
//
// The CLI now has its own `dependencies` — `src/cli/generated/npmPackage.json`,
// derived from this list by `scripts/buildCliManifest.ts` — so anything left
// external here is a package `npm install -g @edgeapp/cli` has to fetch.
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

/**
 * External modules are side-effect free; the bundle's own are not.
 *
 * Rollup keeps a module it cannot prove side-effect free, even after
 * tree-shaking every binding away — so the built client opened with six bare
 * `require`s it never used: `edge-core-js`, `biggystring`,
 * `csv-stringify/lib/browser/sync`, `sha.js`, `sprintf-js` and `date-fns`.
 * Measured on this machine, five runs each: `node lib/edgeCli.js help` was
 * 162 ms with them and 68 ms without, byte-identical output — so most of
 * every command's fixed overhead was spent loading modules the client cannot
 * reach, while `src/cli/index.ts` states the opposite as its contract
 * ("Nothing here imports `edge-core-js`").
 *
 * Externals only. The bundle's own modules keep their side effects, because
 * the client's `import './bootNodeLocale'` and `import './commands/all'` are
 * side-effect imports and dropping them would unregister every command.
 */
const treeshake = { moduleSideEffects: (id, isExternal) => !isExternal }

export default [
  {
    external,
    treeshake,
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
    treeshake,
    input: 'src/cli/engine/index.ts',
    output: {
      banner: '#!/usr/bin/env node',
      file: 'lib/edgeEngine.js',
      format: 'cjs'
    },
    plugins: [json(), babel(babelOpts), resolve(resolveOpts)]
  }
]
