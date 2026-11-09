import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(__dirname, '../../..')

interface GatePaths {
  GATE_PATHS: string[]
  SHARED_MODULES: string[]
  isGatedPath: (file: string) => boolean
  uncoveredModules: () => string[]
  ungatedCliModules: () => string[]
  unwatchedCliModules: () => string[]
}

// `require`, because `scripts/cliNodeSafeSmoke.js` runs under plain Node with
// no sucrase, so the list it shares has to be CommonJS JavaScript.
const gate: GatePaths = require('../../../scripts/util/cliGatePaths')

/**
 * The CLI gates must be able to see an edit to anything the CLI shares.
 *
 * `precommit:cli` skips the gates when nothing it watches is staged. Most of
 * the modules the Node-safety smoke test loads live under `src/util` and
 * `src/locales`, so a pathspec that missed them would let a `react-native`
 * import added to one of them commit with that smoke test and both offline
 * suites skipped.
 */
describe('CLI gate paths', () => {
  it('covers every module the smoke test loads', () => {
    expect(gate.uncoveredModules()).toStrictEqual([])
  })

  it('names every module outside src/cli that the CLI loads', () => {
    // The mirror of the case above: that one proves `GATE_PATHS` reaches the
    // list, this one proves the list is the set the CLI actually loads.
    expect(gate.unwatchedCliModules()).toStrictEqual([])
  })

  it('gates every module the CLI imports', () => {
    // The question the other two do not ask. Both of them compare a
    // hand-written list against something; this one walks the CLI's own
    // entry points and asks whether every module they reach is under a path
    // that makes the gate run. A commit staging only a module that is not
    // would print "no CLI changes" and skip `docs:api:gates`,
    // `cli:manifest:check`, `cli:plugins:check`, `test:cli:node-safe` and
    // `test:cli:offline`.
    expect(gate.ungatedCliModules()).toStrictEqual([])
  })

  it('watches the shared GUI trees the old pathspec missed', () => {
    for (const file of [
      'src/util/utils.ts',
      'src/util/txDisplay/displayInfo.ts',
      'src/locales/strings.ts',
      'package.json',
      // The lock decides the published manifest's dependency values, so a
      // lock-only commit — `npm dedupe`, a dependabot bump, a caret that
      // re-resolved — has to run the gates too.
      'package-lock.json'
    ]) {
      expect(gate.isGatedPath(file)).toBe(true)
    }
  })

  it('still ignores a change that cannot reach the CLI', () => {
    for (const file of [
      'src/components/scenes/HomeScene.tsx',
      'android/build.gradle',
      'README.md'
    ]) {
      expect(gate.isGatedPath(file)).toBe(false)
    }
  })

  it('does not match a sibling by prefix', () => {
    // One case per gate entry whose name is a prefix of a real sibling:
    // `src/cli` must not swallow `src/clipboard.ts`, and `src/util` must
    // not swallow `src/utilities.ts`. `startsWith` alone would take both.
    expect(gate.isGatedPath('src/clipboard.ts')).toBe(false)
    expect(gate.isGatedPath('src/utilities.ts')).toBe(false)
  })

  it('gates every repository file the manifest generator reads', () => {
    // The direction `unwatchedCliModules()` establishes for the module
    // graph, applied to the generator's other inputs. Every dependency
    // *value* in the committed manifest is a resolution out of
    // `package-lock.json`, so an input outside the gate paths would let a
    // commit that changes it skip `cli:manifest:check`, and CI would then
    // fail at `docs:api:committed` once `npm run prepare` regenerates the
    // manifest, with nothing local having warned.
    // A tree without the generator has no manifest to stale, and one that
    // *claims* it, through a `cli:manifest` script, must have the file.
    const generatorPath = path.join(ROOT, 'scripts/buildCliManifest.ts')
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
    )
    if (!fs.existsSync(generatorPath)) {
      expect(pkg.scripts['cli:manifest']).toBeUndefined()
      return
    }
    const generator = fs.readFileSync(generatorPath, 'utf8')
    const read = new Set<string>()
    for (const match of generator.matchAll(
      /path\.join\(ROOT,\s*'([^']+)'\)/g
    )) {
      // `node_modules` is not in the repository, so it cannot be staged.
      if (match[1].startsWith('node_modules')) continue
      read.add(match[1])
    }
    expect(read.size).toBeGreaterThan(1)
    expect([...read].filter(file => !gate.isGatedPath(file))).toStrictEqual([])
  })
})
