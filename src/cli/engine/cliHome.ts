/**
 * The CLI's own home directory, and the paths under it.
 *
 * The CLI builds every path under `~/.edge-cli` from here, so the root that
 * `docs/EDGE_CLI.md` documents is declared once and moves in one place.
 *
 * Resolved at call time, not at module load: under jest `os.homedir()` is
 * what the tests stub, and a value captured at import would be the
 * developer's real home.
 *
 * No imports beyond `os` and `path`, so any module can use it.
 */
import os from 'os'
import { join } from 'path'

/** `~/.edge-cli`. */
export function cliHome(): string {
  return join(os.homedir(), '.edge-cli')
}

/** `~/.edge-cli/run`, which holds one directory per profile. */
export function cliRunRoot(): string {
  return join(cliHome(), 'run')
}

/** `~/.edge-cli/logs`, one file per profile. */
export function cliLogsDir(): string {
  return join(cliHome(), 'logs')
}

/** A file directly under `~/.edge-cli`, such as `keys.json`. */
export function cliHomeFile(name: string): string {
  return join(cliHome(), name)
}
