/**
 * A cache for `extractRoutes`, keyed on the whole working tree.
 *
 * `docs:api:gates` runs six processes and five of them extract the same
 * routes from the same program — ~46 s of a 50 s chain on an idle machine,
 * measured, and the chain is in `verify`, in CI and behind `cliGateNeeded`
 * in the pre-commit hook. The first process now extracts and the rest read.
 *
 * The key is what makes this safe in a *gate*, where a stale answer is a
 * false pass. The extracted types come from the whole program the route
 * files reach — `schemas.ts`, `src/util`, `edge-core-js` — so keying on the
 * route files would serve last edit's types. This keys on `HEAD`, every
 * modified or untracked file's *contents*, and the installed dependency set
 * (`node_modules/.package-lock.json`, which npm rewrites on every install).
 * Any edit anywhere in the repository is a new key. When git cannot answer,
 * there is no key and no cache.
 */
import { spawnSync } from 'child_process'
import crypto from 'crypto'
import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * The environment with every `GIT_*` variable removed.
 *
 * Inside a git hook — and `docs:api:gates` runs inside the pre-commit hook —
 * git exports `GIT_DIR` and `GIT_INDEX_FILE`, which override `cwd`: a git
 * child would then answer for the hook's repository whatever `root` says.
 * Scrubbed, `cwd` decides.
 */
export function gitFreeEnv(
  source: NodeJS.ProcessEnv = process.env
): NodeJS.ProcessEnv {
  // Seeded and then blanked, like `engineEnv`: Node drops a variable whose
  // value is `undefined` from a child's environment, and this keeps the
  // declared `ProcessEnv` type without a dynamic `delete`.
  const out: NodeJS.ProcessEnv = { ...source }
  const scratch: Record<string, string | undefined> = out
  for (const name of Object.keys(source)) {
    if (name.startsWith('GIT_')) scratch[name] = undefined
  }
  return out
}

function git(root: string, args: string[]): string | undefined {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  return result.status === 0 && result.error == null ? result.stdout : undefined
}

/** A fingerprint of everything the extraction could depend on, or null. */
export function extractionCacheKey(root: string): string | null {
  const head = git(root, ['rev-parse', 'HEAD'])
  const status = git(root, [
    'status',
    '--porcelain=v1',
    '-z',
    '--untracked-files=all'
  ])
  if (head == null || status == null) return null

  const hash = crypto.createHash('sha256')
  hash.update(head)
  hash.update(status)
  // Every path the status names, by content: `status` alone says *that* a
  // file changed, and a second edit to an already-modified file leaves it
  // byte-identical.
  const entries = status.split('\0').filter(entry => entry !== '')
  for (let i = 0; i < entries.length; ++i) {
    const entry = entries[i]
    const paths = [entry.slice(3)]
    // A rename or copy carries its source as the next entry.
    if (entry.startsWith('R') || entry.startsWith('C')) paths.push(entries[++i])
    for (const file of paths) {
      hash.update(`\0${file}\0`)
      try {
        hash.update(fs.readFileSync(path.join(root, file)))
      } catch {
        hash.update('<absent>')
      }
    }
  }
  try {
    const installed = fs.statSync(
      path.join(root, 'node_modules', '.package-lock.json')
    )
    hash.update(`${installed.size}:${installed.mtimeMs}`)
  } catch {
    hash.update('<no install>')
  }
  return hash.digest('hex').slice(0, 32)
}

function cachePath(key: string): string {
  return path.join(os.tmpdir(), `edge-cli-routes-${key}.json`)
}

/** The cached value for this key, or undefined. */
export function readExtractionCache<T>(key: string): T | undefined {
  try {
    return JSON.parse(fs.readFileSync(cachePath(key), 'utf8')) as T
  } catch {
    return undefined
  }
}

/** Store a value, atomically, so a concurrent reader never sees half. */
export function writeExtractionCache(key: string, value: unknown): void {
  const target = cachePath(key)
  const temporary = `${target}.${process.pid}.tmp`
  try {
    fs.writeFileSync(temporary, JSON.stringify(value))
    fs.renameSync(temporary, target)
  } catch {
    // A cache that cannot be written is only a slower next run.
  }
}
