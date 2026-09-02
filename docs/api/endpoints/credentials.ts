import { f, nul, opt, s } from '../schema'
import { endpoint, group } from '../types'
import { sessionId } from './common'

export const credentialsGroup = group({
  id: 'credentials',
  title: 'Credentials',
  doc: 'Password, PIN, username and recovery changes on a logged-in account. Each route is named after its `account.*` call and takes that call’s parameters.',
  endpoints: [
    endpoint({
      id: 'changePassword',
      summary: 'Set or change the password',
      coreCall: 'account.changePassword',
      method: 'POST',
      path: '/accounts/{sessionId}/change-password',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [
        {
          command: 'change-password',
          usage: 'change-password --password=<password>',
          flags: [
            { flag: '--password=<password>', maps: 'password', target: 'body' }
          ],
          example: "edge-cli change-password --password='new-s3cret'"
        }
      ],
      pathParams: [sessionId],
      body: s.object([f('password', s.string())]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'deletePassword',
      summary: 'Remove password login',
      coreCall: 'account.deletePassword',
      method: 'POST',
      path: '/accounts/{sessionId}/delete-password',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [],
      pathParams: [sessionId],
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'checkPassword',
      summary: 'Verify a password',
      description:
        'Checks without changing anything — useful to gate a destructive action.',
      coreCall: 'account.checkPassword',
      method: 'POST',
      path: '/accounts/{sessionId}/check-password',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([f('password', s.string())]),
      success: {
        status: 200,
        schema: s.object([
          f(
            'ok',
            s.boolean(),
            '`false` for a wrong password — this is not an error response.'
          )
        ])
      }
    }),

    endpoint({
      id: 'getPin',
      summary: 'Read the account PIN',
      description:
        'Returns the PIN itself, not a status flag. Treat the response as secret.',
      coreCall: 'account.getPin',
      method: 'GET',
      path: '/accounts/{sessionId}/get-pin',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [],
      pathParams: [sessionId],
      success: {
        status: 200,
        schema: s.object([
          nul(
            'pin',
            s.string({ example: '1234' }),
            '`null` when no PIN is set.'
          )
        ])
      }
    }),

    endpoint({
      id: 'changePin',
      summary: 'Set or change the PIN',
      coreCall: 'account.changePin',
      method: 'POST',
      path: '/accounts/{sessionId}/change-pin',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [
        {
          command: 'change-pin',
          usage: 'change-pin --pin=<pin>',
          flags: [{ flag: '--pin=<pin>', maps: 'pin', target: 'body' }],
          example: 'edge-cli change-pin --pin=1234'
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f('pin', s.string({ example: '1234' })),
        opt('enableLogin', s.boolean(), 'Core `ChangePinOptions.enableLogin`.'),
        opt('forDuressAccount', s.boolean())
      ]),
      success: {
        status: 200,
        schema: s.object([
          f('pin2Key', s.string(), 'The new PIN login key core returns.')
        ])
      },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'deletePin',
      summary: 'Remove the PIN',
      coreCall: 'account.deletePin',
      method: 'POST',
      path: '/accounts/{sessionId}/delete-pin',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [
        {
          command: 'delete-pin',
          usage: 'delete-pin',
          example: 'edge-cli delete-pin'
        }
      ],
      pathParams: [sessionId],
      success: { status: 204 }
    }),

    endpoint({
      id: 'checkPin',
      summary: 'Verify a PIN',
      coreCall: 'account.checkPin',
      method: 'POST',
      path: '/accounts/{sessionId}/check-pin',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([
        f('pin', s.string()),
        opt('forDuressAccount', s.boolean())
      ]),
      success: { status: 200, schema: s.object([f('ok', s.boolean())]) }
    }),

    endpoint({
      id: 'changeUsername',
      summary: 'Change the username',
      coreCall: 'account.changeUsername',
      method: 'POST',
      path: '/accounts/{sessionId}/change-username',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [],
      pathParams: [sessionId],
      body: s.object([
        f('username', s.string({ example: 'alice2' })),
        opt(
          'password',
          s.string(),
          'Core `ChangeUsernameOptions.password`, required when the account has one.'
        )
      ]),
      success: { status: 204 },
      errors: ['USERNAME_ERROR', 'BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'changeRecovery',
      summary: 'Set recovery questions and answers',
      coreCall: 'account.changeRecovery',
      method: 'POST',
      path: '/accounts/{sessionId}/change-recovery',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [
        {
          command: 'change-recovery',
          usage:
            'change-recovery --question=<q> --answer=<a> [--question=<q> --answer=<a> …]',
          flags: [
            {
              flag: '--question=<q>',
              maps: 'questions[]',
              target: 'body',
              doc: 'Repeatable; paired positionally with `--answer`.'
            },
            { flag: '--answer=<a>', maps: 'answers[]', target: 'body' }
          ],
          example:
            "edge-cli change-recovery --question='First pet?' --answer=rex"
        }
      ],
      pathParams: [sessionId],
      body: s.object([
        f('questions', s.array(s.string())),
        f(
          'answers',
          s.array(s.string()),
          'Same length and order as `questions`.'
        )
      ]),
      success: {
        status: 200,
        schema: s.object([
          f(
            'recoveryKey',
            s.string(),
            'Core returns this string. It is what `POST /login-with-recovery2` calls `recovery2Key`.'
          )
        ])
      },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'deleteRecovery',
      summary: 'Disable recovery login',
      coreCall: 'account.deleteRecovery',
      method: 'POST',
      path: '/accounts/{sessionId}/delete-recovery',
      source: 'src/cli/engine/routes/credentials.ts',
      cli: [],
      pathParams: [sessionId],
      success: { status: 204 }
    })
  ]
})
