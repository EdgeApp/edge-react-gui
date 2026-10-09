import {
  asArray,
  asBoolean,
  asEither,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { doc } from '../doc'
import { route } from '../route'
import {
  asCoreValue,
  asCreateCurrencyWallet,
  asSession,
  asWalletSummary
} from '../schemas'
import {
  getAccount,
  getSession,
  summarizeWallet,
  summarizeWalletResults,
  unloadedWallets
} from './helpers'

/**
 * Account and session summary.
 *
 * Session fields are spread at the top level alongside the account's own
 * properties — there is no nested `session` object.
 *
 * @note The `otpEnabled` and `otpResetPending` flags here are derived. For the
 *   secret itself use `otp-key`.
 * @coreNote Engine composite of the session record plus EdgeAccount
 *   properties.
 */
export const accountInfo = route({
  core: null,
  method: 'GET',
  path: '/account/{sessionId}',
  cli: 'account-info',
  returns: asObject({
    appId: doc(asString, 'Application this session logged into.'),
    created: doc(
      asEither(asString, asValue(null)),
      'When the account was created, null for accounts predating the field.'
    ),
    lastLogin: doc(asString, 'The previous login, not this one.'),
    loggedIn: doc(
      asBoolean,
      'False once the account has been logged out; the session object outlives it briefly.'
    ),
    recoveryKey: doc(
      asEither(asString, asValue(null)),
      'Present only while recovery is configured.'
    ),
    otpEnabled: doc(asBoolean, '2FA is on for this account.'),
    otpResetPending: doc(
      asBoolean,
      'True while somebody has a reset pending against this account.'
    ),
    canDuressLogin: doc(
      asBoolean,
      'A duress PIN is configured, so this account can be opened in duress mode.'
    ),
    isDuressAccount: doc(
      asBoolean,
      'True when this very session is the duress account rather than the real one.'
    ),
    edgeLogin: doc(asBoolean, 'This account was reached by QR login.'),
    keyLogin: doc(asBoolean, 'This session was reached with a login key.'),
    newAccount: doc(
      asBoolean,
      'This session created the account rather than logging into an existing one.'
    ),
    passwordLogin: doc(asBoolean, 'This session was reached with a password.'),
    pinLogin: doc(asBoolean, 'This session was reached with a PIN.'),
    recoveryLogin: doc(
      asBoolean,
      'This session was reached by answering recovery questions.'
    )
  }).withRest,

  handler(ctx) {
    const session = getSession(ctx)
    const { account } = session
    const info = ctx.state.sessions.toInfo(session)
    return {
      ...info,
      username: account.username,
      rootLoginId: account.rootLoginId,
      appId: account.appId,
      created: account.created?.toISOString() ?? null,
      lastLogin: account.lastLogin.toISOString(),
      loggedIn: account.loggedIn,
      recoveryKey: account.recoveryKey ?? null,
      otpEnabled: account.otpKey != null,
      otpResetPending: account.otpResetDate != null,
      canDuressLogin: account.canDuressLogin,
      isDuressAccount: account.isDuressAccount,
      edgeLogin: account.edgeLogin,
      keyLogin: account.keyLogin,
      newAccount: account.newAccount,
      passwordLogin: account.passwordLogin,
      pinLogin: account.pinLogin,
      recoveryLogin: account.recoveryLogin
    }
  }
})

/**
 * Log out.
 *
 * Ends the session and drops it from the engine. Any subscription scoped to
 * this account or its wallets is closed with it.
 */
export const logout = route({
  core: 'account.logout',
  method: 'POST',
  path: '/account/{sessionId}/logout',
  cli: {
    command: 'logout',
    custom: true,
    notes: 'Also clears the stored id from `session.json`.'
  },

  async handler(ctx) {
    await ctx.state.sessions.logout(ctx.params.sessionId)
    return undefined
  }
})

/**
 * Keepalive.
 *
 * Resets the idle auto-logout timer without doing any other work.
 *
 * @coreNote Engine auto-logout timer; core has no idle concept.
 */
export const touchSession = route({
  core: null,
  method: 'POST',
  path: '/account/{sessionId}/touch',
  cli: 'touch',
  returns: doc(asSession, 'The session, with a refreshed `expiresAt`.'),

  handler(ctx) {
    return ctx.state.sessions.touch(ctx.params.sessionId)
  }
})

/**
 * Read the account login key.
 *
 * The key `login-with-key` takes. It grants full account access, so treat the
 * output as secret.
 */
export const getLoginKey = route({
  core: 'account.getLoginKey',
  method: 'GET',
  path: '/account/{sessionId}/get-login-key',
  cli: 'get-login-key',
  returns: asObject({
    loginKey: doc(asString, 'base58. Full account access — keep it safe.')
  }),

  async handler(ctx) {
    return { loginKey: await getAccount(ctx).getLoginKey() }
  }
})

/**
 * Force an account data sync.
 *
 * Pushes and pulls the account repos immediately rather than waiting for the
 * next scheduled sync.
 */
export const accountSync = route({
  core: 'account.sync',
  method: 'POST',
  path: '/account/{sessionId}/sync',
  cli: {
    command: 'sync',
    notes: 'Named `sync` for the account; the wallet one is `wallet-sync`.'
  },
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).sync()
    return undefined
  }
})

/**
 * Permanently delete the remote account.
 *
 * Irreversible. The account is removed from the login server, and funds in its
 * wallets are unrecoverable without the keys. The session is logged out
 * afterwards.
 *
 * @note The engine performs no confirmation check — the call runs as soon as
 *   it arrives, so any guard has to live in the caller. The command requires
 *   `--yes` for exactly this reason.
 */
export const deleteRemoteAccount = route({
  core: 'account.deleteRemoteAccount',
  method: 'POST',
  path: '/account/{sessionId}/delete-remote-account',
  cli: {
    command: 'delete-remote-account',
    custom: true,
    extra: {
      yes: {
        kind: 'boolean',
        required: true,
        doc: 'Confirms intent. Without it the command refuses to run.'
      }
    }
  },
  errors: ['NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).deleteRemoteAccount()
    await ctx.state.sessions.logout(ctx.params.sessionId)
    return undefined
  }
})

/**
 * Wait for every wallet to finish loading.
 *
 * Wallets load in the background after login, so a list taken straight
 * afterwards can be short. This resolves once each active wallet has either
 * loaded or failed — balances may still be syncing afterwards.
 *
 * @note There is no timeout: a wallet that never resolves holds this open.
 *   The engine's own idle shutdown does not fire while a request is in
 *   flight, so give the client one.
 */
export const waitForAllWallets = route({
  core: 'account.waitForAllWallets',
  method: 'POST',
  path: '/account/{sessionId}/wait-for-all-wallets',
  cli: 'wait-for-all-wallets',
  returns: asObject({
    unloadedWallets: doc(
      asArray(asCoreValue),
      'The active wallets core did *not* build an API for, each with its `walletId`, `walletType`, `pluginId`, `pluginRegistered` and `pluginHasLoadedWallet`. Empty is the healthy answer. This call used to return nothing, so an account with a wallet the CLI cannot load got `ok` and a short `currency-wallets` list with no explanation. The engine cannot say *why* core declined — a registered plugin can still fail to build an engine, and in a Node CLI that is usually a native module the package does not carry — so what it says is this: `pluginRegistered: false` means no plugin claims that wallet type at all, and `pluginHasLoadedWallet: false` means nothing of that type loaded, so the plugin is the common factor rather than these wallets. The reason itself, when a plugin reports one, is in `~/.edge-cli/logs/engine-<profile>.log`, or in `engine-<profile>-startup.log` where a plugin’s own stderr lands; `EDGE_CLI_LOG_LEVEL=info` keeps core’s own chatter as well.'
    )
  }),

  async handler(ctx) {
    const account = getAccount(ctx)
    await account.waitForAllWallets()
    // Core's promise resolves once each active wallet has *settled*, so
    // anything still missing from `currencyWallets` has failed rather than
    // being slow. That is the one moment this can be said without a race.
    const unloaded = unloadedWallets(account)
    if (unloaded.length > 0) {
      ctx.state.logger.warn(
        `${unloaded.length} of ${account.activeWalletIds.length} active ` +
          'wallets did not load',
        {
          walletTypes: [...new Set(unloaded.map(w => w.walletType))].join(','),
          // The types with no loaded wallet at all, which is the half an
          // operator can do nothing about: the plugin is registered — every
          // one is, because `edge-currency-accountbased` registers monero,
          // zano, zcash and piratechain whether or not their native modules
          // are here — and nothing of that type works in this build. A type
          // that is *absent* from this list has a sibling that loaded, so
          // the fault is those wallets rather than the plugin.
          typesWithNothingLoaded: [
            ...new Set(
              unloaded
                .filter(w => !w.pluginHasLoadedWallet)
                .map(w => w.walletType)
            )
          ].join(','),
          notRegistered: [
            ...new Set(
              unloaded.filter(w => !w.pluginRegistered).map(w => w.walletType)
            )
          ].join(',')
        }
      )
    }
    return { unloadedWallets: unloaded }
  }
})

/**
 * List the account's loaded wallets.
 *
 * Every wallet core has built an API for, which is the account's active set:
 * `activeWalletIds` is `ids.filter(id => !archived)`, so an archived or
 * deleted wallet is not here. Paused wallets are.
 *
 * This took a `filter` of `active`, `archived`, `hidden` or `all`, and three
 * of those four could not work. The handler resolved each id through
 * `account.currencyWallets`, which core builds from `activeWalletIds`
 * **alone**, so the archived and hidden lists were disjoint from the
 * resolvable set by construction: every id mapped to `undefined`, the
 * `filter(wallet != null)` dropped it, and `?filter=archived` answered
 * `{"currencyWallets":[]}` on every account, always. `all` concatenated the
 * three lists, so it was `active` with each hidden wallet — which is active
 * and hidden at once, core deriving the two flags independently — listed
 * twice. Nor could the missing wallets be served in this shape: an archived
 * wallet has no loaded API, so `name`, `currencyCode`, `blockHeight`,
 * `syncStatus` and `paused` do not exist for it, and seven required response
 * fields would have had to become nullable for every caller to carry three
 * values that never worked.
 *
 * `all-keys` is the route for that, and already was: it returns
 * `EdgeWalletInfoFull[]` — id, type, `archived`, `deleted`, `hidden`,
 * `sortIndex` — which is everything knowable about a wallet core has not
 * loaded.
 *
 * @note Wallets load in the background after login, so a list taken straight
 *   afterwards can be short. Call `wait-for-all-wallets` first to be sure the
 *   account has finished loading.
 * @note Archived, deleted and hidden wallets are not here, because core
 *   builds no API for them. Use `all-keys`, which carries their ids and
 *   their flags.
 * @coreNote account.currencyWallets is keyed by activeWalletIds.
 */
export const currencyWallets = route({
  core: 'account.currencyWallets',
  method: 'GET',
  path: '/account/{sessionId}/currency-wallets',
  cli: 'currency-wallets',
  returns: asObject({
    currencyWallets: doc(
      asArray(asWalletSummary),
      'Every wallet core has loaded for this account, including paused ones. Archived, deleted and hidden wallets are not loaded; `all-keys` lists those.'
    ),
    unloadedWallets: doc(
      asArray(asCoreValue),
      'The active wallets that are *not* in the list above, each with its `walletId`, `walletType`, `pluginId`, `pluginRegistered` and `pluginHasLoadedWallet`. Before `wait-for-all-wallets` an entry here may simply still be building; after it, it has failed. They used to be filtered out silently, so this list was the difference between `all-keys` and this one and a caller had to compute it — and nothing said why a wallet was missing. See `wait-for-all-wallets` for what the two plugin fields do and do not claim.'
    )
  }),

  async handler(ctx) {
    const account = getAccount(ctx)
    const currencyWallets = account.activeWalletIds
      .map(id => account.currencyWallets[id])
      // A wallet whose api has not finished building yet, which is the race
      // the `wait-for-all-wallets` note is about — or one that failed, which
      // is what `unloadedWallets` is for. Dropping them silently is what
      // made an account with an unloadable asset look like a shorter
      // account.
      .filter((wallet): wallet is EdgeCurrencyWallet => wallet != null)
      .map(summarizeWallet)
    return { currencyWallets, unloadedWallets: unloadedWallets(account) }
  }
})

/**
 * Create a currency wallet.
 *
 * @note The fiat currency is not set here. Core still accepts it on create,
 *   but that path is deprecated — use `set-fiat-currency-code` afterwards, so
 *   there is one way to do it.
 */
export const createCurrencyWallet = route({
  core: 'account.createCurrencyWallet',
  method: 'POST',
  path: '/account/{sessionId}/create-currency-wallet',
  cli: 'create-currency-wallet',
  body: asObject({
    walletType: doc(
      asString,
      'From `currency-configs`, e.g. `wallet:bitcoin`.'
    ),
    name: asOptional(doc(asString, 'Display name.')),
    importText: asOptional(
      doc(asString, 'Seed or key text to import instead of generating.')
    )
  }).withRest,
  returns: asWalletSummary,
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const wallet = await getAccount(ctx).createCurrencyWallet(
      ctx.body.walletType,
      {
        name: ctx.body.name,
        importText: ctx.body.importText
      }
    )
    return summarizeWallet(wallet)
  }
})

/**
 * Create several wallets at once.
 *
 * Partial success is normal: each entry reports its own outcome, and one
 * failure does not roll back the others.
 *
 * @note Core's batch first, one entry at a time only when it throws.
 *   `account.createCurrencyWallets` makes every entry's keys at once, stores
 *   them with one `applyKit` — one login-server round trip and one stash
 *   rewrite — and finishes the wallets concurrently, returning an
 *   `EdgeResult` per entry. One-at-a-time paid a round trip and a stash
 *   rewrite per wallet and waited for each to finish before starting the
 *   next, which is the cost a batch endpoint exists to avoid. But the batch
 *   *throws*, rather than reporting per entry, when it cannot make an
 *   entry's keys — an unknown wallet type, a plugin that cannot build its
 *   tools — and that happens before anything is stored. So a throw falls
 *   back to one call per entry, which gives each its own outcome: the
 *   per-entry envelope this route publishes.
 */
export const createCurrencyWallets = route({
  core: 'account.createCurrencyWallets',
  method: 'POST',
  path: '/account/{sessionId}/create-currency-wallets',
  cli: 'create-currency-wallets',
  body: asObject({
    createWallets: doc(
      asArray(asCreateCurrencyWallet),
      '`EdgeCreateCurrencyWallet[]`: walletType, plus optional name and fiatCurrencyCode.'
    )
  }).withRest,
  returns: asObject({
    results: doc(
      asArray(asCoreValue),
      'Mirrors core’s EdgeResult[]: `{ ok: true, wallet }`, or `{ ok: false, error, code, status }` with the same code the engine would answer for that failure on its own — and `details` where it has them.'
    )
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const account = getAccount(ctx)
    try {
      return summarizeWalletResults(
        await account.createCurrencyWallets(ctx.body.createWallets)
      )
    } catch {
      // Nothing was stored; see the note above. Each entry now gets its own
      // answer, including the one that made the batch throw.
    }
    // Sequentially, not `Promise.all`: each call writes the account's
    // synced key repo.
    const results: Array<
      { ok: true; result: EdgeCurrencyWallet } | { ok: false; error: unknown }
    > = []
    for (const create of ctx.body.createWallets) {
      try {
        results.push({
          ok: true,
          result: await account.createCurrencyWallet(create.walletType, create)
        })
      } catch (error: unknown) {
        results.push({ ok: false, error })
      }
    }
    return summarizeWalletResults(results)
  }
})
