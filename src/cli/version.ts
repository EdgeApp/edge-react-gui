import { version } from '../../package.json'

/**
 * The version in the app's `package.json` when this CLI was built.
 *
 * A named import, so rollup's JSON plugin inlines this one string into each
 * bundle rather than the whole file: a built CLI reports the version it was
 * built from, wherever it runs. The published package carries the same
 * number, because `scripts/buildCliManifest.ts` keeps the two in lockstep.
 */
export const CLI_VERSION: string = version
