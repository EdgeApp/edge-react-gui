/**
 * Section titles and order for the generated reference.
 *
 * Keyed by route-file basename, which is also the group each `route()` in that
 * file belongs to. Everything else about an endpoint comes from its
 * declaration in `src/cli/engine/routes/`.
 */
export interface GroupInfo {
  id: string
  title: string
  doc: string
  /** Section this group sits under, from `sectionOrder`. */
  section: string
}

/**
 * The top level of the reference: the core object a call acts on.
 *
 * `EdgeContext`, `EdgeAccount` and `EdgeCurrencyWallet` are the three objects
 * the API is built on, so they are the three main sections; the engine daemon
 * is its own, having no core object at all. Everything else that does not
 * belong to one of them stands alone rather than being filed under a section
 * it only half fits.
 */
export interface SectionInfo {
  id: string
  title: string
  doc: string
}

export const sectionOrder: SectionInfo[] = [
  {
    id: 'engine',
    title: 'Engine',
    doc: 'The `edge-engine` daemon itself. None of these have an `edge-core-js` equivalent — they describe the process — and none need a session.'
  },
  {
    id: 'context',
    title: 'Context',
    doc: 'Calls on the shared `EdgeContext`: device state, username queries, and every way of logging in. None of them need a session, because a session is what they produce.'
  },
  {
    id: 'account',
    title: 'Account',
    doc: 'Calls on a logged-in `EdgeAccount`, addressed by `sessionId`. All of these can also return `401 INVALID_SESSION` or `401 SESSION_EXPIRED`.'
  },
  {
    id: 'wallet',
    title: 'Wallet',
    doc: 'Calls on a single `EdgeCurrencyWallet`. Each names its wallet with `--wallet-id`, which accepts a full id or any unique prefix.'
  },
  {
    id: 'local-settings',
    title: 'Local settings',
    doc: 'Device-local account settings, stored outside the synced repos. They follow the account but never leave the machine.'
  },
  {
    id: 'swap',
    title: 'Swap',
    doc: 'Exchanging one asset for another through the swap plugins.'
  },
  {
    id: 'rates',
    title: 'Exchange rates',
    doc: 'Fiat and crypto pricing, current and historical.'
  },
  {
    id: 'objects',
    title: 'Object handles',
    doc: 'A core value with methods on it cannot cross JSON, so the engine keeps it and hands back an id. These read and release any of them.'
  },
  {
    id: 'admin',
    title: 'Admin',
    doc: 'The `$internalStuff` escape hatch: login-server and sync-repo access that no ordinary caller needs.'
  }
]

export const groupOrder: GroupInfo[] = [
  {
    id: 'status',
    title: 'Lifecycle',
    section: 'engine',
    doc: 'Lifecycle and configuration of the `edge-engine` daemon. None of these have an `edge-core-js` equivalent — they describe the daemon itself — and none need a session.'
  },
  {
    id: 'context',
    title: 'Device and usernames',
    section: 'context',
    doc: 'Calls on the shared `EdgeContext`: local device state and login-server queries that do not need a session.'
  },
  {
    id: 'login',
    title: 'Login methods',
    section: 'context',
    doc: 'Every successful login returns a [Session](#schema-Session) and registers it in the engine, so later calls need only the `sessionId`. The CLI writes that id to `session.json` automatically.'
  },
  {
    id: 'account',
    title: 'Session',
    section: 'account',
    doc: 'Calls on a logged-in `EdgeAccount`, addressed by `sessionId`. All of these can also return `401 INVALID_SESSION` or `401 SESSION_EXPIRED`.'
  },
  {
    id: 'localSettings',
    title: 'Local settings',
    section: 'local-settings',
    doc: 'Device-local account settings, stored outside the synced repos.'
  },
  {
    id: 'credentials',
    title: 'Credentials',
    section: 'account',
    doc: 'Password, PIN, username and recovery changes on a logged-in account.'
  },
  {
    id: 'otp',
    title: 'Two-factor authentication',
    section: 'account',
    doc: 'OTP state and the reset flow a user falls back on after losing their authenticator.'
  },
  {
    id: 'vouchers',
    title: 'Vouchers',
    section: 'account',
    doc: 'When 2FA blocks a login, the login server issues a voucher an already-trusted device can approve or reject.'
  },
  {
    id: 'lobby',
    title: 'Approving a login',
    section: 'account',
    doc: 'The other side of `request-edge-login`: a logged-in account inspecting and approving a login somebody scanned.'
  },
  {
    id: 'keys',
    title: 'Keys',
    section: 'account',
    doc: 'Raw key infrastructure beneath the wallet API. Several of these return private key material, and the engine has no transport auth — treat any process that can reach the socket as fully trusted.'
  },
  {
    id: 'wallets',
    title: 'Wallet state',
    section: 'wallet',
    doc: 'Account-level wallet listing and creation, then per-wallet calls. A `{walletId}` segment accepts a unique prefix, so those routes can also return `404 WALLET_NOT_FOUND` or `409 AMBIGUOUS_WALLET_ID`.'
  },
  {
    id: 'tokens',
    title: 'Tokens',
    section: 'wallet',
    doc: 'Which tokens a wallet tracks. Enabled tokens are the ones it syncs balances for; detected ones were seen on-chain but are not yet enabled.'
  },
  {
    id: 'transactions',
    title: 'Transactions',
    section: 'wallet',
    doc: 'Reading transaction history, exporting it, and editing its metadata.'
  },
  {
    id: 'objects',
    title: 'Object handles',
    section: 'objects',
    doc: 'A core value with methods on it — a staged transaction, a swap quote, a pending login — cannot cross JSON, so the engine keeps it and hands back an id. These read and release any of them.'
  },
  {
    id: 'spend',
    title: 'Spending',
    section: 'wallet',
    doc: 'Two ways to send funds. `spend` does the whole thing in one call; the staged workflow — `make-spend`, `sign-tx`, `broadcast-tx`, `save-tx` — hands back an object handle at each step so fees can be inspected before committing.'
  },
  {
    id: 'swap',
    title: 'Swap quotes',
    section: 'account',
    doc: 'Cross-asset exchange. Quotes are live objects held server-side under a `swap_` handle, so approving one means naming its `objectId` rather than re-uploading the quote.'
  },
  {
    id: 'uri',
    title: 'URIs',
    section: 'wallet',
    doc: 'Parsing and building BIP21-style payment URIs through the wallet’s own plugin, so chain-specific quirks are handled for you.'
  },
  {
    id: 'rates',
    title: 'Exchange rates',
    section: 'rates',
    doc: 'Historical and current rates through the same batching queue the GUI uses. No session required.'
  },
  {
    id: 'dataStore',
    title: 'Data store',
    section: 'account',
    doc: 'The account’s synced key-value store, where plugins keep their own state. One route per `EdgeDataStore` method.'
  },
  {
    id: 'admin',
    title: 'Admin',
    section: 'admin',
    doc: '**Debugging only — not for production apps.** These reach into `context.$internalStuff`, the private surface of `edge-core-js`, and can corrupt an account’s synced repos. They take no `sessionId`: they act on the context, not on a logged-in account.'
  },
  {
    id: 'events',
    title: 'Event stream',
    section: 'engine',
    doc: 'A Server-Sent Events feed of engine activity, served outside the router because the response never ends.'
  }
]
