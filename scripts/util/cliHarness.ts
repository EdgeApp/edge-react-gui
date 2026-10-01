/**
 * What the CLI's offline suites share.
 *
 * `testCliFake.ts` and `testCliSubscribe.ts` each carried a byte-identical
 * `EDGE_CLI_BIN` / `CLI` block with the same comment, and all three suites
 * had their own pass/fail counter and summary printer. One copy, so a change
 * to how the suites are pointed at a built bundle happens once.
 */
import os from 'os'
import path from 'path'

/**
 * How to invoke the CLI: the sources through sucrase, or a built bundle.
 *
 * `EDGE_CLI_BIN` runs a suite against `lib/edgeCli.js` instead. Three
 * transforms produce a CLI — sucrase here, Babel for jest, and
 * `@babel/preset-env` for the rollup bundle — and only the bundle is what
 * `build:cli` produces and what `docs/EDGE_CLI.md` tells people to run, so a
 * transform-only defect is invisible to every other suite.
 */
export const CLI: string[] =
  process.env.EDGE_CLI_BIN != null
    ? [process.env.EDGE_CLI_BIN]
    : ['-r', 'sucrase/register', 'src/cli/index.ts']

/** Where the CLI keeps its per-profile run directories. */
export function runRoot(): string {
  return path.join(os.homedir(), '.edge-cli', 'run')
}

/** A pass/fail tally with the summary line the suites print. */
export class Checks {
  passes = 0
  failures = 0
  private readonly label: string

  constructor(label: string) {
    this.label = label
  }

  /** Record one check. `detail` is printed only on failure. */
  check(name: string, ok: boolean, detail?: string): boolean {
    if (ok) {
      this.passes++
      console.log(`OK   ${name}`)
    } else {
      this.failures++
      console.error(`FAIL ${name}${detail == null ? '' : ` — ${detail}`}`)
    }
    return ok
  }

  /** Print the summary and exit non-zero if anything failed. */
  finish(): void {
    if (this.failures === 0) {
      console.log(`\n${this.label}: all checks passed`)
      return
    }
    console.log(
      `\n${this.label}: ${this.passes} passed, ${this.failures} failed`
    )
    process.exit(1)
  }
}
