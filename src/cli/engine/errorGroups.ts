/**
 * Error codes that recur across routes, declared once.
 *
 * `docs/api/README.md` tells every contributor to reuse these rather than
 * restating them, which is only possible if they live somewhere both sides
 * can reach: here, in runtime code, so the routes can import them and the
 * docs can re-export them — routes importing from `docs/` would have the
 * dependency backwards.
 *
 * No imports, so nothing is dragged in by using them.
 */

/** Errors possible on any session-scoped route. */
export const SESSION_ERRORS = ['INVALID_SESSION', 'SESSION_EXPIRED']

/** Errors possible on any route that names a wallet. */
export const WALLET_ERRORS = ['WALLET_NOT_FOUND', 'AMBIGUOUS_WALLET_ID']

/** Errors possible on any route that takes an object handle. */
export const HANDLE_ERRORS = [
  'OBJECT_NOT_FOUND',
  'OBJECT_EXPIRED',
  'OBJECT_KIND_MISMATCH',
  // No offline test produces this: it needs a staged `tx_` handle, which
  // needs a successful `make-spend`, which needs a funded wallet — and the
  // fake world cannot fund one. `test:cli:network` against a funded tester
  // account is where it would be exercised.
  'OBJECT_WALLET_MISMATCH',
  'OBJECT_SESSION_MISMATCH'
]
