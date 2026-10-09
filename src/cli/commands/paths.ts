/**
 * The two account-scoped path shapes the hand-written commands build.
 *
 * `accountPath` existed in `account.ts` with one caller, `walletPath` in
 * `wallet.ts` was the same template plus `/wallet`, and four other call sites
 * wrote the `/account/${encodeURIComponent(sessionId)}…` template out by
 * hand. The encoding is the part that must not be forgotten: a sessionId is
 * base58 so it needs none today, but a path built without it is one id format
 * away from a broken URL.
 */
export function accountPath(sessionId: string, suffix = ''): string {
  return `/account/${encodeURIComponent(sessionId)}${suffix}`
}

/**
 * A wallet-scoped URL.
 *
 * The wallet id is not in it: ids are base64, so `7o7i6/tlI+qi…=` contains a
 * path delimiter. It travels as a named argument instead — in the query for
 * `GET`, the body for `POST`.
 */
export function walletPath(sessionId: string, suffix = ''): string {
  return accountPath(sessionId, `/wallet${suffix}`)
}
