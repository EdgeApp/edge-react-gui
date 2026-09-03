import {
  asArray,
  asBoolean,
  asEither,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

import { doc } from '../doc'
import { route } from '../route'
import { getAccount } from './helpers'

const PASSWORD_DOC = 'The account password.'
const PIN_DOC = 'The device PIN, usually four digits.'
const DURESS_DOC = 'Act on the duress account rather than the real one.'

/**
 * Set or change the password.
 *
 * The login server enforces its own rules; `check-password-rules` scores a
 * candidate first.
 */
export const changePassword = route({
  core: 'account.changePassword',
  method: 'POST',
  path: '/account/{sessionId}/change-password',
  cli: 'change-password',
  body: asObject({ password: doc(asString, 'The new password.') }).withRest,
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).changePassword(ctx.body.password)
    return undefined
  }
})

/**
 * Remove password login.
 *
 * The account keeps its other login methods; only the password stops working.
 */
export const deletePassword = route({
  core: 'account.deletePassword',
  method: 'POST',
  path: '/account/{sessionId}/delete-password',
  cli: 'delete-password',
  errors: ['BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).deletePassword()
    return undefined
  }
})

/**
 * Verify a password.
 *
 * Checks without changing anything, which is how a caller gates a destructive
 * action behind a re-entry prompt.
 */
export const checkPassword = route({
  core: 'account.checkPassword',
  method: 'POST',
  path: '/account/{sessionId}/check-password',
  cli: 'check-password',
  body: asObject({ password: doc(asString, PASSWORD_DOC) }).withRest,
  returns: asObject({
    ok: doc(asBoolean, 'False for a wrong password — not an error response.')
  }),

  async handler(ctx) {
    return { ok: await getAccount(ctx).checkPassword(ctx.body.password) }
  }
})

/**
 * Read the account PIN.
 *
 * Returns the PIN itself, not a status flag, so treat the output as secret.
 */
export const getPin = route({
  core: 'account.getPin',
  method: 'GET',
  path: '/account/{sessionId}/get-pin',
  cli: 'get-pin',
  returns: asObject({
    pin: doc(asEither(asString, asValue(null)), 'Null when no PIN is set.')
  }),

  async handler(ctx) {
    const pin = await getAccount(ctx).getPin()
    return { pin: pin ?? null }
  }
})

/**
 * Set or change the PIN.
 */
export const changePin = route({
  core: 'account.changePin',
  method: 'POST',
  path: '/account/{sessionId}/change-pin',
  cli: 'change-pin',
  body: asObject({
    pin: doc(asString, 'The new PIN.'),
    enableLogin: asOptional(
      doc(asBoolean, 'Allow logging in with this PIN on this device.')
    ),
    forDuressAccount: asOptional(doc(asBoolean, DURESS_DOC))
  }).withRest,
  returns: asObject({
    pin2Key: doc(asString, 'The new PIN login key core returns.')
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const pin2Key = await getAccount(ctx).changePin({
      pin: ctx.body.pin,
      enableLogin: ctx.body.enableLogin,
      forDuressAccount: ctx.body.forDuressAccount
    })
    return { pin2Key }
  }
})

/**
 * Remove the PIN.
 *
 * PIN login stops working on this device; other methods are untouched.
 */
export const deletePin = route({
  core: 'account.deletePin',
  method: 'POST',
  path: '/account/{sessionId}/delete-pin',
  cli: 'delete-pin',

  async handler(ctx) {
    await getAccount(ctx).deletePin()
    return undefined
  }
})

/**
 * Verify a PIN.
 */
export const checkPin = route({
  core: 'account.checkPin',
  method: 'POST',
  path: '/account/{sessionId}/check-pin',
  cli: 'check-pin',
  body: asObject({
    pin: doc(asString, PIN_DOC),
    forDuressAccount: asOptional(doc(asBoolean, DURESS_DOC))
  }).withRest,
  returns: asObject({
    ok: doc(asBoolean, 'False for a wrong PIN — not an error response.')
  }),

  async handler(ctx) {
    const ok = await getAccount(ctx).checkPin(ctx.body.pin, {
      forDuressAccount: ctx.body.forDuressAccount
    })
    return { ok }
  }
})

/**
 * Change the username.
 *
 * The old name is released, so it becomes available to anyone else.
 */
export const changeUsername = route({
  core: 'account.changeUsername',
  method: 'POST',
  path: '/account/{sessionId}/change-username',
  cli: 'change-username',
  body: asObject({
    username: doc(asString, 'The new username.'),
    password: asOptional(
      doc(asString, 'Required by core when the account has a password.')
    )
  }).withRest,
  errors: ['USERNAME_ERROR', 'BAD_REQUEST', 'NETWORK_ERROR'],

  async handler(ctx) {
    await getAccount(ctx).changeUsername({
      username: ctx.body.username,
      password: ctx.body.password
    })
    return undefined
  }
})

/**
 * Set recovery questions and answers.
 *
 * The returned key is half of the credential: without it the answers alone
 * cannot recover the account, so it has to be stored somewhere else.
 *
 * @coreNote Our surface drops the `2` from core's recovery2 naming; a future
 *   Recovery1 would be suffixed `V1`.
 */
export const changeRecovery = route({
  core: 'account.changeRecovery',
  method: 'POST',
  path: '/account/{sessionId}/change-recovery',
  cli: {
    command: 'change-recovery',
    flags: {
      question: { maps: 'questions', repeat: true },
      answer: { maps: 'answers', repeat: true }
    }
  },
  body: asObject({
    questions: doc(asArray(asString), 'The questions to ask.'),
    answers: doc(asArray(asString), 'Same length and order as `questions`.')
  }).withRest,
  returns: asObject({
    recoveryKey: doc(
      asString,
      'Store this out of band. `login-with-recovery` needs it alongside the answers.'
    )
  }),
  errors: ['BAD_REQUEST'],

  async handler(ctx) {
    const recoveryKey = await getAccount(ctx).changeRecovery(
      ctx.body.questions,
      ctx.body.answers
    )
    return { recoveryKey }
  }
})

/**
 * Disable recovery login.
 *
 * The existing recovery key stops working.
 */
export const deleteRecovery = route({
  core: 'account.deleteRecovery',
  method: 'POST',
  path: '/account/{sessionId}/delete-recovery',
  cli: 'delete-recovery',

  async handler(ctx) {
    await getAccount(ctx).deleteRecovery()
    return undefined
  }
})
