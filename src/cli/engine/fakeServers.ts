/**
 * The in-process fake server URLs, declared once.
 *
 * `src/cli/index.ts`, `src/cli/engine/index.ts` and `makeCoreContext.ts` all
 * read it, and the first two both feed `profileHash`, where a mismatch
 * between the client's hash and the engine's means the client polls a socket
 * the engine never bound. It is to `--fake` what the shared
 * `TESTER_SERVERS` is to the tester arm beside it.
 *
 * A leaf, with no imports, so both halves can read it: the client's own
 * bundle must not grow a dependency for two strings.
 */
export const FAKE_SERVERS = {
  loginServer: 'fake://login',
  syncServer: 'fake://sync'
} as const
