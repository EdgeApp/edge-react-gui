/**
 * The CLI's own home directory, and the paths under it.
 *
 * `join(os.homedir(), '.edge-cli', …)` was written out at six call sites in
 * four modules — `run`, `logs` twice, `config.json` and `keys.json` — so the
 * one place `docs/EDGE_CLI.md` documents as a single root had no single
 * declaration, and moving it would have silently orphaned whichever sites
 * were missed.
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
