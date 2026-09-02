import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'

export const contextGroup = group({
  id: 'context',
  title: 'Context',
  doc: 'Calls on the shared `EdgeContext`: local device state and login-server queries that do not need a session. Each route is named after the core call it fronts.',
  endpoints: [
    endpoint({
      id: 'localUsers',
      summary: 'List local users on this device',
      coreCall: 'context.localUsers',
      method: 'GET',
      path: '/local-users',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'local-users',
          usage: 'local-users',
          example: 'edge-cli local-users'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f(
            'localUsers',
            s.array(
              s.core(
                'EdgeUserInfo',
                'loginId, username, pinLoginEnabled, keyLoginEnabled, …'
              )
            )
          )
        ])
      }
    }),

    endpoint({
      id: 'forgetAccount',
      summary: 'Forget an account on this device',
      description:
        'Removes locally cached credentials. The remote account is untouched.',
      coreCall: 'context.forgetAccount',
      method: 'POST',
      path: '/forget-account',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'forget-account',
          usage: 'forget-account <rootLoginId>',
          example: 'edge-cli forget-account alice'
        }
      ],
      body: s.object([
        f(
          'rootLoginId',
          s.string(),
          'Core takes a `rootLoginId`. A username is also accepted and resolved against `localUsers` first, so callers need not hash it.'
        )
      ]),
      success: { status: 204 },
      errors: ['USER_NOT_FOUND', 'BAD_REQUEST']
    }),

    endpoint({
      id: 'usernameAvailable',
      summary: 'Check whether a username is free',
      coreCall: 'context.usernameAvailable',
      method: 'GET',
      path: '/username-available',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'username-available',
          usage: 'username-available <username>',
          example: 'edge-cli -t username-available alice',
          notes:
            'No flag for `challengeId`; the client sends one only when `--solve-captcha` has just solved a challenge and is retrying.'
        }
      ],
      query: [
        { name: 'username', schema: s.string(), required: true },
        {
          name: 'challengeId',
          schema: s.string(),
          doc: 'Core `opts.challengeId`. Supply after solving a CAPTCHA to retry.'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f('username', s.string()),
          f('available', s.boolean())
        ])
      },
      errors: ['USERNAME_ERROR', 'CHALLENGE_REQUIRED', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'fixUsername',
      summary: 'Normalize a username',
      coreCall: 'context.fixUsername',
      method: 'GET',
      path: '/fix-username',
      source: 'src/cli/engine/routes/context.ts',
      cli: [],
      query: [{ name: 'username', schema: s.string(), required: true }],
      success: {
        status: 200,
        schema: s.object([
          f('username', s.string(), 'The **normalized** value, not the input.')
        ])
      }
    }),

    endpoint({
      id: 'checkPasswordRules',
      summary: 'Score a candidate password',
      coreCall: 'context.checkPasswordRules',
      method: 'GET',
      path: '/check-password-rules',
      source: 'src/cli/engine/routes/context.ts',
      cli: [],
      query: [{ name: 'password', schema: s.string(), required: true }],
      success: {
        status: 200,
        schema: s.core(
          'EdgePasswordRules',
          'passed, tooShort, noNumber, noLowerCase, noUpperCase, secondsToCrack'
        )
      },
      notes: [
        'Send the password with `curl --get --data-urlencode` rather than putting it in a shell-visible URL.'
      ]
    }),

    endpoint({
      id: 'fetchLoginMessages',
      summary: 'Fetch login-server messages for every local user',
      coreCall: 'context.fetchLoginMessages',
      method: 'GET',
      path: '/fetch-login-messages',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'fetch-login-messages',
          usage: 'fetch-login-messages',
          example: 'edge-cli fetch-login-messages'
        }
      ],
      success: {
        status: 200,
        schema: s.core(
          'EdgeLoginMessages',
          'Keyed by loginId; each value carries otpResetPending and pendingVouchers.'
        ),
        doc: 'Passed straight through from core.'
      },
      errors: ['NETWORK_ERROR']
    }),

    endpoint({
      id: 'requestOtpReset',
      summary: 'Request a 2FA reset',
      description:
        'Starts the timed reset a user falls back on after losing their authenticator. Needs the `otpResetToken` from an earlier `OTP_REQUIRED` error.',
      coreCall: 'context.requestOtpReset',
      method: 'POST',
      path: '/request-otp-reset',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'request-otp-reset',
          usage: 'request-otp-reset <username> --otp-reset-token=<token>',
          flags: [
            {
              flag: '--otp-reset-token=<token>',
              maps: 'otpResetToken',
              target: 'body'
            }
          ],
          example: "edge-cli -t request-otp-reset alice --otp-reset-token='…'"
        }
      ],
      body: s.object([
        f('username', s.string()),
        f(
          'otpResetToken',
          s.string(),
          'From `details.resetToken` on an `OTP_REQUIRED` error.'
        )
      ]),
      success: {
        status: 200,
        schema: s.object([
          f(
            'resetDate',
            s.date(),
            'When the reset completes if nobody cancels it.'
          )
        ])
      },
      errors: ['USERNAME_ERROR', 'BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'fetchRecovery2Questions',
      summary: 'Fetch a user’s recovery questions',
      coreCall: 'context.fetchRecovery2Questions',
      method: 'GET',
      path: '/fetch-recovery2-questions',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'fetch-recovery2-questions',
          usage:
            'fetch-recovery2-questions <username> --recovery-key=<recovery2Key>',
          flags: [
            {
              flag: '--recovery-key=<key>',
              maps: 'recovery2Key',
              target: 'query'
            }
          ],
          example:
            "edge-cli -t fetch-recovery2-questions alice --recovery-key='…'"
        }
      ],
      query: [
        { name: 'recovery2Key', schema: s.string(), required: true },
        { name: 'username', schema: s.string(), required: true }
      ],
      success: {
        status: 200,
        schema: s.object([f('questions', s.array(s.string()))])
      },
      errors: ['USERNAME_ERROR', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'fetchChallenge',
      summary: 'Pre-fetch a CAPTCHA challenge',
      description:
        'Lets a client solve a challenge before it hits `403 CHALLENGE_REQUIRED` mid-flow.',
      coreCall: 'context.fetchChallenge',
      method: 'POST',
      path: '/fetch-challenge',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'fetch-challenge',
          usage: 'fetch-challenge',
          example: 'edge-cli -t fetch-challenge'
        }
      ],
      body: s.object([], { open: true }),
      bodyDoc: 'None.',
      success: {
        status: 200,
        schema: s.object(
          [
            f('challengeId', s.string({ example: 'GTNMhqW1…' })),
            opt(
              'challengeUri',
              s.string(),
              'Absent when the server considers the challenge already satisfied.'
            )
          ],
          { open: true }
        )
      },
      errors: ['NETWORK_ERROR']
    }),

    endpoint({
      id: 'currencyConfigs',
      summary: 'List plugin ids usable for wallet creation',
      description:
        'Currency and accountbased plugins only — swap plugins are excluded.',
      coreCall: null,
      coreNote:
        'Engine view of the enabled plugin set; core exposes account.currencyConfig per plugin instead.',
      method: 'GET',
      path: '/currency-configs',
      source: 'src/cli/engine/routes/context.ts',
      cli: [
        {
          command: 'currency-configs',
          usage: 'currency-configs',
          example: 'edge-cli currency-configs'
        }
      ],
      success: {
        status: 200,
        schema: s.object([
          f('pluginIds', s.array(s.string({ example: 'bitcoin' })))
        ])
      }
    })
  ]
})
