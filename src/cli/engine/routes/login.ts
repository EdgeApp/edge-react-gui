import { asArray, asObject, asOptional, asString } from 'cleaners'
import type { EdgeAccount, EdgeAccountOptions } from 'edge-core-js'

import { doc } from '../doc'
import { route } from '../route'
import { asSession } from '../schemas'

interface LoginOptions {
  otp?: string
  otpKey?: string
  challengeId?: string
}

/** The `EdgeAccountOptions` every login shares: 2FA and CAPTCHA. */
function accountOptions(body: LoginOptions): EdgeAccountOptions {
  const opts: EdgeAccountOptions = {}
  if (body.challengeId != null) opts.challengeId = body.challengeId
  if (body.otp != null) opts.otp = body.otp
  if (body.otpKey != null) opts.otpKey = body.otpKey
  return opts
}

/** Options every login and create call accepts, from `EdgeAccountOptions`. */
const loginOptionFields = {
  otp: asOptional(doc(asString, 'A current 2FA code.')),
  otpKey: asOptional(
    doc(asString, 'The 2FA secret itself, instead of a code.')
  ),
  challengeId: asOptional(
    doc(asString, 'Supply after solving a CAPTCHA to retry the same request.')
  )
}

/**
 * Log in with a password.
 *
 * @note With `--solve-captcha` the client solves a `CHALLENGE_REQUIRED`
 *   response headlessly (ALTCHA proof-of-work) and retries once.
 */
export const loginWithPassword = route({
  core: 'context.loginWithPassword',
  method: 'POST',
  path: '/login-with-password',
  cli: { command: 'login-with-password', custom: true },
  body: asObject({
    username: doc(asString, 'The account name.'),
    password: doc(asString, 'The account password.'),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "password"`.'),
  errors: [
    'PASSWORD_ERROR',
    'USERNAME_ERROR',
    'OTP_REQUIRED',
    'CHALLENGE_REQUIRED',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    const account: EdgeAccount = await ctx.state.core.context.loginWithPassword(
      ctx.body.username,
      ctx.body.password,
      accountOptions(ctx.body)
    )
    return await ctx.state.sessions.create(account, 'password')
  }
})

/**
 * Create an account.
 *
 * Every credential is optional over REST: omitting all three creates a light
 * account with no username.
 *
 * @note The command requires a username, password and PIN. Creating a light
 *   account is REST-only.
 */
export const createAccount = route({
  core: 'context.createAccount',
  method: 'POST',
  path: '/create-account',
  cli: {
    command: 'create-account',
    custom: true
  },
  body: asObject({
    username: asOptional(doc(asString, 'The name to claim.')),
    password: asOptional(doc(asString, 'The account password.')),
    pin: asOptional(doc(asString, 'A device PIN to save.')),
    ...loginOptionFields
  }).withRest,
  returns: doc(asSession, 'A session with `loginMethod: "create"`.'),
  errors: [
    'USERNAME_ERROR',
    'CHALLENGE_REQUIRED',
    'BAD_REQUEST',
    'NETWORK_ERROR'
  ],

  async handler(ctx) {
    const account: EdgeAccount = await ctx.state.core.context.createAccount({
      ...accountOptions(ctx.body),
      username: ctx.body.username,
      password: ctx.body.password,
      pin: ctx.body.pin
    })
    return await ctx.state.sessions.create(account, 'create')
  }
})

/**
 * List active sessions.
 *
 * @coreNote The session registry is an engine construct; core has no
 *   multi-account session concept.
 */
export const engineSessions = route({
  core: null,
  method: 'GET',
  path: '/engine/sessions',
  cli: 'engine-sessions',
  returns: doc(asArray(asSession), 'A bare array, not wrapped in a key.'),

  handler(ctx) {
    return ctx.state.sessions.list()
  }
})
