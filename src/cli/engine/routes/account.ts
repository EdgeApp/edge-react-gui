import { asBoolean, asEither, asObject, asString, asValue } from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'
import { asSession } from '../schemas'
import { getAccount, getSession } from './helpers'

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
