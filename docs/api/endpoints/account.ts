import { f, nul, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId } from './common'

export const accountGroup = group({
  id: 'account',
  title: 'Account',
  doc: 'Calls on a logged-in `EdgeAccount`, addressed by `sessionId`. Every route here can also return `401 INVALID_SESSION` or `401 SESSION_EXPIRED`; those are not repeated per endpoint.',
  endpoints: [
    endpoint({
      id: 'accountInfo',
      summary: 'Account and session summary',
      description:
        'Session registry fields are spread at the top level alongside the account properties — there is no nested `session` object.',
      coreCall: null,
      coreNote:
        'Engine composite of the session record plus EdgeAccount properties (username, rootLoginId, loggedIn, …).',
      method: 'GET',
      path: '/accounts/{sessionId}',
      source: 'src/cli/engine/routes/account.ts',
      cli: [
        {
          command: 'account-info',
          usage: 'account-info',
          example: 'edge-cli account-info'
        }
      ],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([
          f(
            '…Session',
            s.ref('Session'),
            'Every field of [Session](#schema-Session), spread inline.'
          ),
          f('appId', s.string({ example: '' })),
          nul('created', s.date()),
          f('lastLogin', s.date()),
          f('loggedIn', s.boolean()),
          nul('recoveryKey', s.string()),
          f('otpEnabled', s.boolean()),
          f('otpResetPending', s.boolean()),
          f('canDuressLogin', s.boolean()),
          f('isDuressAccount', s.boolean()),
          f('edgeLogin', s.boolean()),
          f('keyLogin', s.boolean()),
          f('newAccount', s.boolean()),
          f('passwordLogin', s.boolean()),
          f('pinLogin', s.boolean()),
          f('recoveryLogin', s.boolean())
        ])
      },
      notes: [
        'For the 2FA secret itself use `GET /accounts/{sessionId}/otp-key`; the flags here are derived.'
      ]
    }),

    endpoint({
      id: 'logout',
      summary: 'Log out',
      coreCall: 'account.logout',
      method: 'POST',
      path: '/accounts/{sessionId}/logout',
      source: 'src/cli/engine/routes/account.ts',
      cli: [
        {
          command: 'logout',
          usage: 'logout',
          example: 'edge-cli logout',
          notes: 'Also clears the stored id from `session.json`.'
        }
      ],
      pathParams: [sessionId],
      success: { status: 204 }
    }),

    endpoint({
      id: 'touchSession',
      summary: 'Keepalive',
      description:
        'Resets the idle auto-logout timer without doing other work.',
      coreCall: null,
      coreNote: 'Engine auto-logout timer; core has no idle concept.',
      method: 'POST',
      path: '/accounts/{sessionId}/touch',
      source: 'src/cli/engine/routes/account.ts',
      cli: [{ command: 'touch', usage: 'touch', example: 'edge-cli touch' }],
      pathParams: [sessionId],
      body: s.object([], { open: true }),
      bodyDoc: 'None.',
      success: {
        status: 200,
        schema: s.ref('Session'),
        doc: 'The session with a refreshed `expiresAt`.'
      }
    }),

    endpoint({
      id: 'getLoginKey',
      summary: 'Read the account login key',
      description:
        'The key `POST /login-with-key` takes. **Grants full account access — treat it as a secret.**',
      coreCall: 'account.getLoginKey',
      method: 'GET',
      path: '/accounts/{sessionId}/get-login-key',
      source: 'src/cli/engine/routes/account.ts',
      cli: [
        {
          command: 'get-login-key',
          usage: 'get-login-key',
          example: 'edge-cli get-login-key'
        }
      ],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([f('loginKey', s.string(), 'base58')])
      }
    }),

    endpoint({
      id: 'accountSync',
      summary: 'Force an account data sync',
      coreCall: 'account.sync',
      method: 'POST',
      path: '/accounts/{sessionId}/sync',
      source: 'src/cli/engine/routes/account.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([], { open: true }),
      bodyDoc: 'None.',
      success: { status: 204 },
      errors: ['NETWORK_ERROR']
    }),

    endpoint({
      id: 'deleteRemoteAccount',
      summary: 'Permanently delete the remote account',
      description:
        '**Irreversible.** The account is removed from the login server; funds in its wallets are unrecoverable without the keys. The session is logged out afterwards.',
      coreCall: 'account.deleteRemoteAccount',
      method: 'POST',
      path: '/accounts/{sessionId}/delete-remote-account',
      source: 'src/cli/engine/routes/account.ts',
      cli: [],
      pathParams: [sessionId],
      success: { status: 204 },
      errors: ['NETWORK_ERROR'],
      notes: [
        '**The engine performs no confirmation check.** The call runs as soon as it arrives; any guard has to live in the caller.'
      ]
    }),

    endpoint({
      id: 'localSettings',
      summary: 'Read device-local account settings',
      description:
        'Stored in `Settings.json` on `account.localDisklet`, so they are **not synced** — a phone and a CLI have separate copies unless they share an Edge data directory.',
      coreCall: null,
      coreNote:
        'GUI code (src/util/localAccountSettings), reached through account.localDisklet.',
      method: 'GET',
      path: '/accounts/{sessionId}/local-settings',
      source: 'src/cli/engine/routes/localSettings.ts',
      cli: [
        {
          command: 'local-settings',
          usage: 'local-settings',
          summary: 'With no flag, reads the current value.',
          example: 'edge-cli local-settings'
        }
      ],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([
          f(
            'spamFilterOn',
            s.boolean(),
            'Hide spam transactions. Defaults to `true`, matching the GUI.'
          )
        ])
      }
    }),

    endpoint({
      id: 'changeLocalSettings',
      summary: 'Set the spam-filter toggle',
      coreCall: null,
      coreNote: 'GUI code (src/util/localAccountSettings).',
      method: 'POST',
      path: '/accounts/{sessionId}/change-local-settings',
      source: 'src/cli/engine/routes/localSettings.ts',
      cli: [
        {
          command: 'local-settings',
          usage: 'local-settings [--spam-filter-on=true|false]',
          summary: 'With the flag, writes the value.',
          flags: [
            {
              flag: '--spam-filter-on=<bool>',
              maps: 'spamFilterOn',
              target: 'body'
            }
          ],
          example: 'edge-cli local-settings --spam-filter-on=false'
        }
      ],
      pathParams: [sessionId],
      body: s.object([f('spamFilterOn', s.boolean())]),
      bodyDoc: 'Required; omitting it is a `400`, not a no-op.',
      success: {
        status: 200,
        schema: s.object([f('spamFilterOn', s.boolean())])
      },
      errors: ['BAD_REQUEST']
    })
  ]
})
