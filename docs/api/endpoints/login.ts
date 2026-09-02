import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'

/** Fields every login route accepts on top of its own credentials. */
const loginOpts = [
  opt('otp', s.string({ example: '123456' }), 'A current 2FA code.'),
  opt('otpKey', s.string(), 'The 2FA secret itself, instead of a code.'),
  opt('challengeId', s.string(), 'Supply after solving a CAPTCHA to retry.')
]

export const loginGroup = group({
  id: 'login',
  title: 'Login',
  doc: 'Every route here is named after its `context.*` call. Every successful login returns a [Session](#schema-Session) and registers it in the engine, so later calls only need the `sessionId`. The CLI writes that id to `session.json` automatically.',
  endpoints: [
    endpoint({
      id: 'loginPassword',
      coreCall: 'context.loginWithPassword',
      summary: 'Log in with a password',
      method: 'POST',
      path: '/login-with-password',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'login-with-password',
          usage:
            'login-with-password <username> --password=<pass> [--otp=<code>]',
          flags: [
            { flag: '--password=<pass>', maps: 'password', target: 'body' },
            { flag: '--otp=<code>', maps: 'otp', target: 'body' }
          ],
          example: "edge-cli -t login-with-password alice --password='s3cret'",
          notes:
            'With `--solve-captcha`, a `CHALLENGE_REQUIRED` response is solved headlessly (ALTCHA proof-of-work) and the login retried once.'
        }
      ],
      body: s.object([
        f('username', s.string()),
        f('password', s.string()),
        ...loginOpts
      ]),
      success: {
        status: 200,
        schema: s.ref('Session'),
        doc: '`loginMethod` is `password`.'
      },
      errors: [
        'PASSWORD_ERROR',
        'USERNAME_ERROR',
        'OTP_REQUIRED',
        'CHALLENGE_REQUIRED',
        'NETWORK_ERROR'
      ]
    }),

    endpoint({
      id: 'loginPin',
      coreCall: 'context.loginWithPIN',
      summary: 'Log in with a device PIN',
      description:
        'Only works on a device that has already saved a PIN for that account.',
      method: 'POST',
      path: '/login-with-pin',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'login-with-pin',
          usage: 'login-with-pin <usernameOrLoginId> --pin=<pin>',
          flags: [{ flag: '--pin=<pin>', maps: 'pin', target: 'body' }],
          example: 'edge-cli -t login-with-pin alice --pin=1234'
        }
      ],
      body: s.object([
        f('usernameOrLoginId', s.string()),
        f('pin', s.string({ example: '1234' })),
        opt('useLoginId', s.boolean(), 'Treat the value as a login id.'),
        ...loginOpts
      ]),
      success: {
        status: 200,
        schema: s.ref('Session'),
        doc: '`loginMethod` is `pin`.'
      },
      errors: [
        'PASSWORD_ERROR',
        'PIN_DISABLED',
        'USERNAME_ERROR',
        'BAD_REQUEST',
        'NETWORK_ERROR'
      ]
    }),

    endpoint({
      id: 'loginKey',
      coreCall: 'context.loginWithKey',
      summary: 'Log in with an account login key',
      method: 'POST',
      path: '/login-with-key',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'login-with-key',
          usage: 'login-with-key <usernameOrLoginId> --login-key=<key>',
          flags: [
            { flag: '--login-key=<key>', maps: 'loginKey', target: 'body' }
          ],
          example: "edge-cli -t login-with-key alice --login-key='…'"
        }
      ],
      body: s.object([
        f('usernameOrLoginId', s.string()),
        f('loginKey', s.string(), 'From `GET /account/{sessionId}/login-key`.'),
        opt('useLoginId', s.boolean(), 'Treat `username` as a login id.'),
        ...loginOpts
      ]),
      success: {
        status: 200,
        schema: s.ref('Session'),
        doc: '`loginMethod` is `key`.'
      },
      errors: ['PASSWORD_ERROR', 'USERNAME_ERROR', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'loginRecovery',
      coreCall: 'context.loginWithRecovery2',
      coreNote:
        'Our surface drops the `2`: Recovery1 is long gone, and a future revival would be suffixed `V1`. The body field is `recoveryKey`, matching what `change-recovery` returns (`account.recoveryKey`), rather than core’s `recovery2Key`.',
      summary: 'Log in with recovery answers',
      method: 'POST',
      path: '/login-with-recovery',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'login-with-recovery',
          usage:
            'login-with-recovery <username> --recovery-key=<key> --answer=<text> [--answer=<text> …]',
          flags: [
            {
              flag: '--recovery-key=<key>',
              maps: 'recoveryKey',
              target: 'body'
            },
            {
              flag: '--answer=<text>',
              maps: 'answers[]',
              target: 'body',
              doc: 'Repeat once per question, in order.'
            }
          ],
          example:
            "edge-cli -t login-with-recovery alice --recovery-key='…' --answer=blue --answer=paris"
        }
      ],
      body: s.object([
        f('recoveryKey', s.string()),
        f('username', s.string()),
        f(
          'answers',
          s.array(s.string()),
          'In the same order as the questions.'
        ),
        ...loginOpts
      ]),
      success: {
        status: 200,
        schema: s.ref('Session'),
        doc: '`loginMethod` is `recovery`.'
      },
      errors: ['PASSWORD_ERROR', 'USERNAME_ERROR', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'createAccount',
      coreCall: 'context.createAccount',
      summary: 'Create an account',
      description:
        'Every credential is optional — omitting all three creates a light account with no username.',
      method: 'POST',
      path: '/create-account',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'create-account',
          usage: 'create-account <username> --password=<pass> --pin=<pin>',
          flags: [
            { flag: '--password=<pass>', maps: 'password', target: 'body' },
            { flag: '--pin=<pin>', maps: 'pin', target: 'body' }
          ],
          example:
            "edge-cli -t create-account alice --password='s3cret' --pin=1234",
          notes:
            'The command requires all three; the endpoint does not. Creating a light account with no username or password is REST-only.'
        }
      ],
      body: s.object([
        opt('username', s.string()),
        opt('password', s.string()),
        opt('pin', s.string()),
        ...loginOpts
      ]),
      success: {
        status: 200,
        schema: s.ref('Session'),
        doc: '`loginMethod` is `create`.'
      },
      errors: [
        'USERNAME_ERROR',
        'CHALLENGE_REQUIRED',
        'BAD_REQUEST',
        'NETWORK_ERROR'
      ]
    }),

    endpoint({
      id: 'requestEdgeLogin',
      coreCall: 'context.requestEdgeLogin',
      summary: 'Start a QR / lobby login',
      description:
        'Asks the login server for a lobby another logged-in Edge device can approve. The returned `lobbyId` is what goes in the QR code.',
      method: 'POST',
      path: '/request-edge-login',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'request-edge-login',
          usage: 'request-edge-login',
          example: 'edge-cli -t request-edge-login',
          notes:
            'Prints the pending login, then polls `GET /v1/login/edge/{pendingId}` every 2 s for up to 5 minutes. On `done` it stores the session and exits `0`; on `error` or `closed` it exits non-zero.'
        }
      ],
      body: s.object([], { open: true }),
      bodyDoc: 'None. The engine always calls `requestEdgeLogin({})`.',
      success: { status: 200, schema: s.ref('PendingEdgeLogin') },
      errors: ['NETWORK_ERROR'],
      notes: [
        'The pending login is an object handle with a 5 minute TTL. When it expires the engine cancels the request on the login server for you.'
      ]
    }),

    endpoint({
      id: 'pollEdgeLogin',
      coreCall: null,
      coreNote:
        'Engine state for an in-flight requestEdgeLogin; core exposes it as EdgePendingEdgeLogin properties.',
      summary: 'Poll a pending QR login',
      description:
        'Once `state` reaches `done` the engine creates the session itself, so the response carries a ready-to-use `session`.',
      method: 'GET',
      path: '/pending-edge-login/{pendingId}',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'request-edge-login',
          usage: 'request-edge-login',
          summary:
            'Polled internally by `request-edge-login`; not separately invocable.',
          example: 'edge-cli -t request-edge-login'
        }
      ],
      pathParams: [
        {
          name: 'pendingId',
          schema: s.string({ example: 'pending_7Qk3…' }),
          doc: 'The `pendingId` / `objectId` from the start call.'
        }
      ],
      success: { status: 200, schema: s.ref('PendingEdgeLogin') },
      errors: ['PENDING_LOGIN_NOT_FOUND', 'OBJECT_EXPIRED'],
      notes: [
        'Session creation is attempted once. If it fails, the error is sticky on the record and later polls return the same `error` rather than retrying.',
        'Polling does not extend the handle TTL — only the 5 minute window from the start call applies.'
      ]
    }),

    endpoint({
      id: 'cancelEdgeLogin',
      summary: 'Cancel a pending QR login',
      coreCall: 'EdgePendingEdgeLogin.cancelRequest',
      method: 'POST',
      path: '/pending-edge-login/{pendingId}/cancel-request',
      source: 'src/cli/engine/routes/login.ts',
      cli: [
        {
          command: 'cancel-request',
          usage: 'cancel-request <pendingId>',
          example: 'edge-cli cancel-request pending_7Qk3…'
        }
      ],
      pathParams: [
        {
          name: 'pendingId',
          schema: s.string(),
          doc: 'The `pendingId` from the start call.'
        }
      ],
      success: { status: 204 },
      errors: ['PENDING_LOGIN_NOT_FOUND'],
      notes: [
        'If the login already completed and a session exists, that session is force-logged-out too, so cancelling can never leave an orphan visible in `GET /v1/sessions`.'
      ]
    })
  ]
})
