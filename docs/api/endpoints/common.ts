/** Path parameters shared by whole families of routes. */
import { s } from '../schema'
import type { PathParam } from '../types'

export const sessionId: PathParam = {
  name: 'sessionId',
  schema: s.string({ example: 'sess_9xKq2…' }),
  doc: 'From a successful login. The CLI supplies this from `session.json`, `--session`, or `EDGE_CLI_SESSION`.'
}

export const walletId: PathParam = {
  name: 'walletId',
  schema: s.string({ example: 'abc123…' }),
  doc: 'A full base58 wallet id **or a unique prefix**. An ambiguous prefix returns `409 AMBIGUOUS_WALLET_ID` with `details.candidates`.'
}

export const objectId: PathParam = {
  name: 'objectId',
  schema: s.string({ example: 'tx_3fK9…' }),
  doc: 'An ephemeral object handle id.'
}
