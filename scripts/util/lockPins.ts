/**
 * What `package-lock.json` pins a published dependency to, and whether that
 * pin can be published.
 *
 * Lifted out of `buildCliManifest.ts`, which does its work at module scope,
 * so a test can run it: nothing exercised either arm, because today's lock
 * has no off-registry pin on a CLI dependency. A `startsWith` against the
 * wrong prefix would have published a `pack-dependencies` build under a
 * bare semver with nothing to notice.
 */

/** One `packages` entry of a v2/v3 lockfile, as far as this reads it. */
export interface LockEntry {
  version?: string
  resolved?: string
}

/**
 * Where a published dependency has to come from.
 *
 * `version` alone ignored `resolved`, so a dependency the lock pins to an
 * HTTPS tarball — how `pack-dependencies` pins an unpublished `edge-core-js`
 * or `edge-currency-accountbased` build, and how a `test-<cheese>` tree is
 * committed — was published as the bare semver npm recorded beside it. The
 * registry then resolves that version to something the bundle was never
 * built against.
 */
export const NPM_REGISTRY = 'https://registry.npmjs.org/'

/**
 * The exact version the lock resolves `name` to, and the off-registry pin
 * that makes publishing it a lie, if there is one.
 *
 * Exact, not the app's caret range: npm does not publish a lock, so a range
 * would resolve again, elsewhere, later.
 */
export function lockedVersion(
  name: string,
  lockPackages: Record<string, LockEntry>
): { version: string | null; offRegistry: string | undefined } {
  const entry = lockPackages[`node_modules/${name}`]
  const offRegistry =
    entry?.resolved != null && !entry.resolved.startsWith(NPM_REGISTRY)
      ? `${name} (${entry.resolved})`
      : undefined
  return { version: entry?.version ?? null, offRegistry }
}

/**
 * Whether off-registry pins stop the build.
 *
 * Fatal only where a package is about to be published (`--require-bundles`).
 * A development tree pins tarballs routinely — that is the
 * pack-dependencies workflow — and `npm run prepare` runs the manifest
 * build too.
 */
export function offRegistryIsFatal(
  offRegistry: readonly string[],
  requireBundles: boolean
): boolean {
  return requireBundles && offRegistry.length > 0
}
