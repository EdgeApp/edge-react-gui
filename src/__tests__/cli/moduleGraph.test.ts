import { describe, expect, it } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

interface ModuleGraph {
  CLI_ENTRIES: string[]
  packageOf: (specifier: string) => string
  valueSpecifiers: (file: string) => string[]
  walkGraph: (entries: string[]) => {
    modules: string[]
    packages: Set<string>
  }
}

// `require`, because the Node-safety smoke test loads this module under plain
// Node with no sucrase.
const graph: ModuleGraph = require('../../../scripts/util/moduleGraph')

/**
 * What decides the published package's `dependencies`.
 *
 * `npm run cli:manifest --check` regenerates and compares, so it is a
 * staleness gate and cannot see a *wrong* answer; the bundle cross-check only
 * proves the manifest names what the bundles require. The subtle arm is the
 * type-only test: a bare `import './commands/all'` is how every command
 * registers itself and must be followed, while `import { type X } from 'pkg'`
 * contributes no dependency at all — a package declared for a type-only
 * import is one a published CLI installs for nothing, and a side-effect
 * import dropped is a command the CLI does not have.
 */
describe('valueSpecifiers', () => {
  let dir = ''
  const parse = (source: string): string[] => {
    if (dir === '') dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-graph-'))
    const file = path.join(dir, 'probe.ts')
    fs.writeFileSync(file, source)
    return graph.valueSpecifiers(file)
  }

  it('follows a side-effect import', () => {
    // How every CLI command registers itself.
    expect(parse("import './commands/all'\n")).toStrictEqual(['./commands/all'])
  })

  it('drops a type-only import, however it is spelled', () => {
    expect(parse("import type { A } from 'pkg-a'\n")).toStrictEqual([])
    expect(parse("import { type A, type B } from 'pkg-b'\n")).toStrictEqual([])
    expect(parse("export type { A } from 'pkg-c'\n")).toStrictEqual([])
  })

  it('keeps an import that carries one value beside its types', () => {
    expect(parse("import { type A, b } from 'pkg-d'\n")).toStrictEqual([
      'pkg-d'
    ])
    expect(parse("import A, { type B } from 'pkg-e'\n")).toStrictEqual([
      'pkg-e'
    ])
  })

  it('reads require and dynamic import', () => {
    expect(parse("const a = require('pkg-f')\n")).toStrictEqual(['pkg-f'])
    expect(parse("void import('pkg-g')\n")).toStrictEqual(['pkg-g'])
  })

  it('reads a re-export as a value import', () => {
    // `export { x } from './y'` evaluates `./y`.
    expect(parse("export { a } from './y'\n")).toStrictEqual(['./y'])
  })
})

describe('packageOf', () => {
  it('keeps two segments for a scoped package and one otherwise', () => {
    expect(graph.packageOf('@edgeapp/cli')).toBe('@edgeapp/cli')
    expect(graph.packageOf('@edgeapp/cli/lib/thing')).toBe('@edgeapp/cli')
    // A subpath is not a package name: declaring it would be an
    // unresolvable dependency.
    expect(graph.packageOf('csv-stringify/lib/browser/sync')).toBe(
      'csv-stringify'
    )
    expect(graph.packageOf('cleaners')).toBe('cleaners')
  })
})

describe('walkGraph', () => {
  it('reaches both entry points and reports repo-relative modules', () => {
    const { modules, packages } = graph.walkGraph(graph.CLI_ENTRIES)
    expect(modules).toContain('src/cli/index.ts')
    expect(modules).toContain('src/cli/engine/index.ts')
    // Through `sweepTicker.ts`, which is the import the hand-written shared
    // list used to miss.
    expect(modules).toContain('src/util/PeriodicTask.ts')
    // The modules it cares about, not a floor on the count: the count grows
    // with the route set, so `> 100` is an assertion that cannot hold in an
    // earlier tree and says nothing in a later one.
    expect(modules).toContain('src/cli/engine/routes/index.ts')
    expect(modules).toContain('src/cli/commands/all.ts')
    // The packages the published manifest is derived from.
    expect(packages.has('edge-core-js')).toBe(true)
    expect(packages.has('cleaners')).toBe(true)
    // Builtins are not dependencies.
    expect(packages.has('fs')).toBe(false)
    expect(packages.has('node:fs')).toBe(false)
  })
})
