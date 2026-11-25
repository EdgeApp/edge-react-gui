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
        // for browsers. Targeting Node 18 leaves spread native; loose mode
        // would compile `[...aSet]` to `[].concat(aSet)`, which wraps the Set
        // instead of spreading it.
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
  // depend on that plugin at all.)
  plugins: []
}
// `preferBuiltins` said out loud, which also silences the plugin's
// `PREFER_BUILTINS` warning on every build.
const resolveOpts = { extensions, preferBuiltins: true }

// Node builtins, plus whatever `package.json` calls a runtime dependency.
//
// That second part is why a CLI-only package belongs in `devDependencies`:
// listed as a dependency it is left out of the bundle and has to be installed
// alongside it, which also puts it in the React Native app's runtime graph for
// nothing. `nanocolors` is therefore a dev dependency and is bundled.
//
// The CLI has its own `dependencies`, in `src/cli/generated/npmPackage.json`,
// which `scripts/buildCliManifest.ts` derives by the same rule, so anything
// left external here is a package `npm install -g @edgeapp/cli` has to fetch.
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
  // Both reached by the bundles: `util` for the engine's `inspect`, `tty`
  // through the bundled `nanocolors`. Listed so they stay external whatever
  // `preferBuiltins` says, because `node_modules/util` is the browserify
  // shim. `scripts/util/moduleGraph.js`'s `BUILTINS` names them too.
  'tty',
  'util',
  ...Object.keys(packageJson.dependencies)
]

/**
 * External modules are side-effect free; the bundle's own are not.
 *
 * Rollup keeps a module it cannot prove side-effect free, even after
 * tree-shaking every binding away, so without this the built client would
 * open with bare `require`s of packages it never uses, `edge-core-js` among
 * them, and load them on every command, while `src/cli/index.ts` states as
 * its contract that nothing there imports `edge-core-js`.
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
