/**
 * The in-process fake server URLs, declared once.
 *
 * `'fake://login'` was a literal in `src/cli/index.ts`, in
 * `src/cli/engine/index.ts` and in `makeCoreContext.ts`, and the first two
 * both feed `profileHash` — where the comment above it says a mismatch
 * between the client's hash and the engine's means the client polls a socket
 * the engine never bound. The tester arm beside them already takes its URLs
 * from the shared `TESTER_SERVERS`; this is the same move for `--fake`.
 *
 * A leaf, with no imports, so both halves can read it: the client's own
 * bundle must not grow a dependency for three strings.
 */
export const FAKE_SERVERS = {
  loginServer: 'fake://login',
  syncServer: 'fake://sync'
} as const
