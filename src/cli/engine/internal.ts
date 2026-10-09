import type { Disklet } from 'disklet'
import type { EdgeContext, EdgeLobbyRequest } from 'edge-core-js'
import type { Subscriber } from 'yaob'

/**
 * What `makeLobby` takes, which is not what the other two take.
 *
 * Core generates the lobby's keypair itself and writes `publicKey` over
 * whatever it was handed (`lib/core/login/lobby.js:100`), so a caller
 * creating a lobby has only `timeout` and `loginRequest` to say. The hand-
 * written `LobbyRequest` this replaces was one shape for all three, and its
 * `publicKey?: string` disagreed with core's published `EdgeLobbyRequest`,
 * where the field is a required `Uint8Array` — which is how
 * `admin-send-lobby-reply` came to be unable to succeed for any input.
 */
export interface LobbyRequestDraft {
  timeout?: number
  loginRequest?: { appId: string }
}

interface EdgeLobby {
  readonly on: Subscriber<{ error: Error }>
  readonly watch: Subscriber<EdgeLobby>
  readonly lobbyId: string
  readonly replies: unknown[]
  close: () => void
}

interface SyncResult {
  changes: Record<string, unknown>
  status: {
    lastHash?: string | null
    lastSync: number
  }
}

interface EdgeInternalStuff {
  authRequest: (method: string, path: string, body?: object) => Promise<unknown>
  hashUsername: (username: string) => Promise<Uint8Array>
  makeLobby: (
    lobbyRequest: LobbyRequestDraft,
    period?: number
  ) => Promise<EdgeLobby>
  fetchLobbyRequest: (lobbyId: string) => Promise<EdgeLobbyRequest>
  sendLobbyReply: (
    lobbyId: string,
    lobbyRequest: EdgeLobbyRequest,
    replyData: unknown
  ) => Promise<void>
  syncRepo: (syncKey: Uint8Array) => Promise<SyncResult>
  getRepoDisklet: (syncKey: Uint8Array, dataKey: Uint8Array) => Promise<Disklet>
}

export function getInternalStuff(context: EdgeContext): EdgeInternalStuff {
  return (context as unknown as { $internalStuff: EdgeInternalStuff })
    .$internalStuff
}
