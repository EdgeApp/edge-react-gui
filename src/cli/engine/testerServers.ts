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

/** The server set `-t` hands to `makeEdgeContext`. */
export interface TestServers {
  loginServer: string
  infoServer: string
  changeServer: string
  syncServer: string[]
  /**
   * Sync-server WebSocket endpoints. Only set by `EDGE_CLI_SERVERS`; when
   * absent, core derives them from `syncServer`.
   */
  syncWebSocketServer?: string[]
}

/** The shape every server-set check accepts: roles are optional. */
interface ServerUrls {
  loginServer?: string
  infoServer?: string
  changeServer?: string
  syncServer?: string | readonly string[]
  syncWebSocketServer?: string | readonly string[]
}

/**
 * Environment variable holding a JSON object that replaces some or all of the
 * tester fleet under `-t`, e.g. to run against servers on this machine:
 *
 *   EDGE_CLI_SERVERS='{"loginServer":"http://127.0.0.1:8001",
 *     "infoServer":"http://127.0.0.1:8008",
 *     "syncServer":["http://127.0.0.1:8010"]}'
 *
 * `syncWebSocketServer` (a `ws://` URL or a list of them) is the one role
 * with no tester default: left out, core derives the socket from
 * `syncServer`.
 *
 * Every URL it names must be a local or private-network host. Roles it leaves
 * out keep their tester host, so the set can never reach production.
 */
export const SERVERS_ENV = 'EDGE_CLI_SERVERS'

/** True if every configured URL is a -tester or local host: never production. */
export function isTesterConfig(servers: ServerUrls): boolean {
  const hosts = listUrls(servers)
  if (hosts.length === 0) return false
  return hosts.every(h => isTesterUrl(h) || isLocalUrl(h))
}

function isTesterUrl(url: string): boolean {
  return url.includes('-tester') || url.includes('tester-')
}

function listUrls(servers: ServerUrls): string[] {
  const urls: string[] = []
  if (servers.loginServer != null) urls.push(servers.loginServer)
  if (servers.infoServer != null) urls.push(servers.infoServer)
  if (servers.changeServer != null) urls.push(servers.changeServer)
  for (const list of [servers.syncServer, servers.syncWebSocketServer]) {
    if (typeof list === 'string') urls.push(list)
    else if (Array.isArray(list)) urls.push(...list)
  }
  return urls
}

/**
 * True for loopback, RFC 1918, link-local and `.local` mDNS hosts: machines
 * on this computer or its LAN, never a public Edge server.
 */
export function isLocalUrl(url: string): boolean {
  let hostname: string
  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return false
  }
  if (hostname === 'localhost' || hostname.endsWith('.local')) return true
  if (hostname === '[::1]') return true
  const match = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(hostname)
  if (match == null) return false
  const [a, b] = [Number(match[1]), Number(match[2])]
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  )
}

/**
 * The servers `-t` uses: the tester fleet, with any roles named in
 * `EDGE_CLI_SERVERS` replaced by those local URLs.
 *
 * @throws if the override is not a JSON object of URL strings, names an
 *   unknown role, or points anywhere other than a local host.
 */
export function resolveTestServers(
  env: Record<string, string | undefined> = process.env
): TestServers {
  const servers: TestServers = {
    loginServer: TESTER_SERVERS.loginServer,
    infoServer: TESTER_SERVERS.infoServer,
    changeServer: TESTER_SERVERS.changeServer,
    syncServer: [...TESTER_SERVERS.syncServer]
  }
  const text = env[SERVERS_ENV]
  if (text == null || text.trim() === '') return servers

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${SERVERS_ENV} is not valid JSON: ${message}`)
  }
  if (json == null || typeof json !== 'object' || Array.isArray(json)) {
    throw new Error(`${SERVERS_ENV} must be a JSON object`)
  }

  for (const [role, value] of Object.entries(json)) {
    if (role === 'syncServer' || role === 'syncWebSocketServer') {
      const list = typeof value === 'string' ? [value] : value
      if (
        !Array.isArray(list) ||
        list.length === 0 ||
        !list.every(url => typeof url === 'string')
      ) {
        throw new Error(
          `${SERVERS_ENV}.${role} must be a URL or a non-empty list of URLs`
        )
      }
      if (role === 'syncWebSocketServer') {
        const notSocket = list.filter(url => !/^wss?:\/\//i.test(url))
        if (notSocket.length > 0) {
          throw new Error(
            `${SERVERS_ENV}.syncWebSocketServer takes ws:// or wss:// URLs, not ${notSocket.join(
              ', '
            )}`
          )
        }
      }
      servers[role] = list
    } else if (
      role === 'loginServer' ||
      role === 'infoServer' ||
      role === 'changeServer'
    ) {
      if (typeof value !== 'string') {
        throw new Error(`${SERVERS_ENV}.${role} must be a URL string`)
      }
      servers[role] = value
    } else {
      throw new Error(`${SERVERS_ENV} has an unknown role "${role}"`)
    }
  }

  const overridden = listUrls(json as ServerUrls)
  const remote = overridden.filter(url => !isLocalUrl(url))
  if (remote.length > 0) {
    throw new Error(
      `${SERVERS_ENV} may only name local or private-network hosts, not ${remote.join(
        ', '
      )}`
    )
  }
  return servers
}

/**
 * The servers the engine uses: `resolveTestServers()` under `-t`, and core's
 * production defaults otherwise.
 *
 * @throws if `EDGE_CLI_SERVERS` is set without `-t`, so a forgotten flag
 *   cannot silently send a local-stack session to production.
 */
export function resolveServers(
  testMode: boolean,
  env: Record<string, string | undefined> = process.env
): TestServers | undefined {
  if (testMode) return resolveTestServers(env)
  const text = env[SERVERS_ENV]
  if (text != null && text.trim() !== '') {
    throw new Error(`${SERVERS_ENV} only applies with -t / --test`)
  }
  return undefined
}
