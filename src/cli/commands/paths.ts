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

export function walletPath(sessionId: string, suffix = ''): string {
  return accountPath(sessionId, `/wallet${suffix}`)
}
