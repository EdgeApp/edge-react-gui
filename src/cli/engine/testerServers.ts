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

export type TesterServers = typeof TESTER_SERVERS

/** True if every configured URL looks like a -tester host. */
export function isTesterConfig(servers: {
  loginServer?: string
  infoServer?: string
  changeServer?: string
  syncServer?: string | string[]
}): boolean {
  const hosts: string[] = []
  if (servers.loginServer != null) hosts.push(servers.loginServer)
  if (servers.infoServer != null) hosts.push(servers.infoServer)
  if (servers.changeServer != null) hosts.push(servers.changeServer)
  const sync = servers.syncServer
  if (typeof sync === 'string') hosts.push(sync)
  else if (Array.isArray(sync)) hosts.push(...sync)
  if (hosts.length === 0) return false
  return hosts.every(h => h.includes('-tester') || h.includes('tester-'))
}
