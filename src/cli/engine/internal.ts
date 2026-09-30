import type { Disklet } from 'disklet'
import type { EdgeContext } from 'edge-core-js'
import type { Subscriber } from 'yaob'

export interface LobbyRequest {
  timeout?: number
  publicKey?: string
  loginRequest?: { appId: string }
  replies?: unknown[]
}

interface EdgeLobby {
  readonly on: Subscriber<{ error: Error }>
  readonly watch: Subscriber<EdgeLobby>
  readonly lobbyId: string
  readonly replies: unknown[]
  close: () => void
}

export interface SyncResult {
  changes: Record<string, unknown>
  status: {
    lastHash?: string | null
    lastSync: number
  }
}

export interface EdgeInternalStuff {
  authRequest: (method: string, path: string, body?: object) => Promise<unknown>
  hashUsername: (username: string) => Promise<Uint8Array>
  makeLobby: (lobbyRequest: LobbyRequest, period?: number) => Promise<EdgeLobby>
  fetchLobbyRequest: (lobbyId: string) => Promise<LobbyRequest>
  sendLobbyReply: (
    lobbyId: string,
    lobbyRequest: LobbyRequest,
    replyData: unknown
  ) => Promise<void>
  syncRepo: (syncKey: Uint8Array) => Promise<SyncResult>
  getRepoDisklet: (syncKey: Uint8Array, dataKey: Uint8Array) => Promise<Disklet>
  /**
   * The sync WebSocket hosts core follows, which the info server's server
   * list can change after boot. Absent on a core without repo subscriptions.
   */
  readonly syncWebSocketServers?: string[]
  /** Those hosts plus core's open sockets. Absent on the same older cores. */
  getSyncWebSocketStatus?: () => Promise<{
    servers: string[]
    sockets: SyncWebSocketStatus[]
  }>
}

/** One of core's sync-server sockets. */
export interface SyncWebSocketStatus {
  /** The host the socket is on, or will try next. */
  url: string
  connected: boolean
  connecting: boolean
  /** How many repos the socket carries. */
  repoCount: number
}

export function getInternalStuff(context: EdgeContext): EdgeInternalStuff {
  return (context as unknown as { $internalStuff: EdgeInternalStuff })
    .$internalStuff
}
