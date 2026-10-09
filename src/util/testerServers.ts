/**
 * Edge tester fleet. Automated tests MUST use these — never production.
 *
 * Enumerated by DNS probe of *.edge.app (2026-08-05). Only these six resolve.
 */
export const TESTER_SERVERS = {
  loginServer: 'https://login-tester.edge.app',
  infoServer: 'https://info-tester.edge.app',
  changeServer: 'https://change-tester.edge.app',
  syncServer: [
    'https://sync-tester-us1.edge.app',
    'https://sync-tester-us2.edge.app',
    'https://sync-tester-us3.edge.app'
  ]
} as const

/**
 * True when every configured URL names a tester host.
 *
 * `scripts/testCli.ts` runs against live servers with a funded account and
 * refuses to continue unless this answers true, so it is the one thing
 * standing between that harness and production: anything it accepts, the
 * harness will log into, spend from and delete wallets on.
 *
 * Over the *hostname*, not the URL. A substring test over the whole string
 * read `https://login.edge.app/?x=-tester` as the tester fleet — a path or
 * query is attacker- or typo-supplied in a way a hostname is not — and the
 * check has to be the strict one precisely because of what it guards. The
 * first label is where the fleet is named: `login-tester`, `info-tester`,
 * `change-tester`, `sync-tester-us1`.
 */
export function isTesterConfig(servers: {
  loginServer?: string
  infoServer?: string
  changeServer?: string
  // `readonly`, so `TESTER_SERVERS` itself — an `as const` — can be passed
  // in. Its own test is the first caller that tried.
  syncServer?: string | readonly string[]
}): boolean {
  const urls: string[] = []
  if (servers.loginServer != null) urls.push(servers.loginServer)
  if (servers.infoServer != null) urls.push(servers.infoServer)
  if (servers.changeServer != null) urls.push(servers.changeServer)
  const sync = servers.syncServer
  if (typeof sync === 'string') urls.push(sync)
  else if (Array.isArray(sync)) urls.push(...sync)
  // An empty set is not "every URL is a tester URL": a config that names no
  // server at all falls back to production inside core.
  if (urls.length === 0) return false
  return urls.every(isTesterUrl)
}

function isTesterUrl(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    // Not a URL at all. Core would reject it later; this says no now.
    return false
  }
  const label = hostname.split('.')[0]
  return /(^|-)tester(-|$)/.test(label)
}
