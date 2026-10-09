import fs from 'fs'
import path from 'path'

// The same list `precommit:cli` watches; see `scripts/util/cliGatePaths.js`.
const { GATE_PATHS } = require('../../../scripts/util/cliGatePaths') as {
  GATE_PATHS: string[]
}

/** The repository root, for the walk below and for relative reporting. */
const ROOT = path.resolve(__dirname, '../../..')

/**
 * Every `.ts` file the CLI owns, plus the GUI modules it shares.
 *
 * Both halves: this walked `src/cli` and `scripts` and nothing else, so
 * `src/util/txDisplay/`, `src/util/txExport/`, `src/locales/` and the rest
 * were outside it — and the extracted GUI slice is exactly where a move
 * leaves a block behind.
 *
 * The trees come from `GATE_PATHS`, which `precommit:cli` already decides on,
 * so "what the CLI shares" is answered in one place.
 */
function sources(): string[] {
  const out: string[] = []
  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      // `scripts/r3-hack/` vendors a whole `node_modules`; third-party
      // typings are not this repo's comments to keep straight.
      if (entry.name === 'node_modules') continue
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.ts')) out.push(full)
    }
  }
  for (const gate of GATE_PATHS) {
    const full = path.join(ROOT, gate)
    if (!fs.existsSync(full)) continue
    if (fs.statSync(full).isDirectory()) walk(full)
    else if (gate.endsWith('.ts')) out.push(full)
  }
  return out
}

describe('doc comments', () => {
  it('walks every gate path, and says so if one stops resolving', () => {
    // The assertion below is `toEqual([])`, which an empty file list
    // satisfies — so a `GATE_PATHS` that is renamed or narrowed would leave
    // this suite green over nothing, which is the state it exists to make
    // impossible. 259 files across the seven gate paths when this was
    // written; the floor is there to catch a list that collapsed, not to
    // track the count.
    expect(sources().length).toBeGreaterThan(200)
    for (const gate of GATE_PATHS) {
      expect(fs.existsSync(path.join(ROOT, gate))).toBe(true)
    }
  })

  /**
   * A `/**` directly under a closing `*\/` means the first block documents
   * nothing.
   *
   * Editing a doc comment's neighbourhood — inserting a helper above the
   * symbol the comment belongs to, or moving the symbol down — leaves the
   * block behind attached to the wrong thing, and the symbol it was written
   * for has no doc on hover. It happened six times while this CLI was
   * written, twice at the same site after it was fixed by hand, which is why
   * it is a test rather than a convention.
   */
  it('has no JSDoc block stacked on another', () => {
    const stacked: string[] = []
    for (const file of sources()) {
      const lines = fs.readFileSync(file, 'utf8').split('\n')
      for (let i = 1; i < lines.length; i++) {
        if (!/^\s*\*\/\s*$/.test(lines[i - 1])) continue
        if (!/^\s*\/\*\*/.test(lines[i])) continue
        stacked.push(`${path.relative(ROOT, file)}:${i + 1}`)
      }
    }
    expect(stacked).toEqual([])
  })
})
