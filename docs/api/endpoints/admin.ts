import { f, opt, s } from '../schema'
import { endpoint, group } from '../types'

const syncKey = {
  name: 'syncKey',
  schema: s.string({ example: 'SYNCKEY' }),
  doc: 'Base58 repo sync key.'
}
const dataKey = {
  name: 'dataKey',
  schema: s.string({ example: 'DATAKEY' }),
  doc: 'Base58 repo data key.'
}

export const adminGroup = group({
  id: 'admin',
  title: 'Admin',
  doc: '**Debugging only — not for production apps.** These reach into `context.$internalStuff`, the private surface of `edge-core-js`, and can corrupt an account’s synced repos. They take no `sessionId`: they act on the context, not on a logged-in account.',
  endpoints: [
    endpoint({
      id: 'adminAuthRequest',
      coreCall: 'context.$internalStuff.authRequest',
      summary: 'Raw login-server request',
      description:
        'Sends an arbitrary request with the context’s credentials attached.',
      method: 'POST',
      path: '/admin/auth-request',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-auth-request',
          usage:
            "admin-auth-request --method=<m> --path=<path> [--body='<json>']",
          flags: [
            { flag: '--method=<m>', maps: 'method', target: 'body' },
            { flag: '--path=<path>', maps: 'path', target: 'body' },
            { flag: "--body='<json>'", maps: 'body', target: 'body' }
          ],
          example:
            'edge-cli -t admin-auth-request --method=GET --path=/v2/messages'
        }
      ],
      body: s.object([
        f('method', s.string({ example: 'POST' })),
        f(
          'path',
          s.string({ example: '/v2/login' }),
          'Login-server path, not an engine path.'
        ),
        opt('body', s.map(s.unknown()))
      ]),
      success: {
        status: 200,
        schema: s.unknown('Whatever the login server returned.')
      },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'adminHashUsername',
      coreCall: 'context.$internalStuff.hashUsername',
      summary: 'Hash a username',
      description:
        'Reproduces the login server’s username hashing, to derive a login id offline.',
      method: 'GET',
      path: '/admin/hash-username',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-hash-username',
          usage: 'admin-hash-username <username>',
          example: 'edge-cli admin-hash-username alice'
        }
      ],
      query: [{ name: 'username', schema: s.string(), required: true }],
      success: {
        status: 200,
        schema: s.object([f('loginId', s.string(), 'Base58.')])
      }
    }),

    endpoint({
      id: 'adminCreateLobby',
      coreCall: 'context.$internalStuff.makeLobby',
      summary: 'Create a lobby',
      description:
        'A lobby polls the login server until closed, so the engine parks it under a `lobby_` handle and closes it on expiry rather than leaking the poll for the life of the process.',
      method: 'POST',
      path: '/admin/make-lobby',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-make-lobby',
          usage: "admin-make-lobby [--body='<json>'] [--period-seconds=<n>]",
          flags: [
            { flag: "--body='<json>'", maps: 'lobbyRequest', target: 'body' },
            { flag: '--period-seconds=<n>', maps: 'period', target: 'body' }
          ],
          example: 'edge-cli -t admin-make-lobby'
        }
      ],
      body: s.object([
        opt('lobbyRequest', s.map(s.unknown()), 'Defaults to `{}`.'),
        opt('period', s.number(), 'Poll interval in seconds.')
      ]),
      success: {
        status: 200,
        schema: s.object([
          f('objectId', s.string({ example: 'lobby_7Qk3…' })),
          f('expiresAt', s.date()),
          f('lobbyId', s.string()),
          f(
            'replies',
            s.array(s.unknown()),
            'Empty at creation; re-read the handle to see replies arrive.'
          )
        ])
      },
      errors: ['NETWORK_ERROR'],
      notes: [
        'Release with `DELETE /v1/admin/lobby-handle/{objectId}` when done, or the poll runs for the full 5 minutes.'
      ]
    }),

    endpoint({
      id: 'adminDeleteLobbyHandle',
      coreCall: null,
      coreNote: 'Engine handle store for a lobby created via makeLobby.',
      summary: 'Close a parked lobby',
      method: 'POST',
      path: '/admin/lobby-handle/{objectId}/delete',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-lobby-handle-delete',
          usage: 'admin-lobby-handle-delete <objectId>',
          example: 'edge-cli -t admin-lobby-handle-delete lobby_7Qk3…'
        }
      ],
      pathParams: [
        { name: 'objectId', schema: s.string({ example: 'lobby_7Qk3…' }) }
      ],
      success: { status: 200, schema: s.ref('Ok') },
      errors: ['OBJECT_NOT_FOUND'],
      notes: [
        'Not under `/account/{sessionId}/objects/`, because admin lobbies belong to no session.'
      ]
    }),

    endpoint({
      id: 'adminFetchLobby',
      coreCall: 'context.$internalStuff.fetchLobbyRequest',
      summary: 'Read a lobby’s contents',
      method: 'GET',
      path: '/admin/fetch-lobby-request',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-fetch-lobby-request',
          usage: 'admin-fetch-lobby-request <lobbyId>',
          example: 'edge-cli -t admin-fetch-lobby-request HbC9mVJ2xR4tN8pL'
        }
      ],
      query: [{ name: 'lobbyId', schema: s.string(), required: true }],
      success: {
        status: 200,
        schema: s.unknown('The raw lobby request from `fetchLobbyRequest`.')
      },
      errors: ['NETWORK_ERROR']
    }),

    endpoint({
      id: 'adminLobbyReply',
      coreCall: 'context.$internalStuff.sendLobbyReply',
      summary: 'Reply to a lobby',
      method: 'POST',
      path: '/admin/send-lobby-reply',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-send-lobby-reply',
          usage:
            "admin-send-lobby-reply <lobbyId> --lobby-request='<json>' [--reply-data='<json>']",
          flags: [
            {
              flag: "--lobby-request='<json>'",
              maps: 'lobbyRequest',
              target: 'body'
            },
            { flag: "--reply-data='<json>'", maps: 'replyData', target: 'body' }
          ],
          example: `edge-cli -t admin-send-lobby-reply LOBBY --lobby-request='{}'`
        }
      ],
      body: s.object([
        f('lobbyId', s.string()),
        f(
          'lobbyRequest',
          s.map(s.unknown()),
          'Required. Normally the object from `admin-fetch-lobby-request`.'
        ),
        opt('replyData', s.unknown())
      ]),
      success: { status: 204 },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'adminSyncRepo',
      coreCall: 'context.$internalStuff.syncRepo',
      summary: 'Sync a repo',
      method: 'POST',
      path: '/admin/sync-repo',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-sync-repo',
          usage: 'admin-sync-repo <syncKey>',
          example: 'edge-cli -t admin-sync-repo SYNCKEY'
        }
      ],
      body: s.object([f('syncKey', s.string(), 'Base58.')]),
      success: {
        status: 200,
        schema: s.unknown('The changeset summary from `syncRepo`.')
      },
      errors: ['BAD_REQUEST', 'NETWORK_ERROR']
    }),

    endpoint({
      id: 'adminListRepoFiles',
      coreCall: 'context.$internalStuff.getRepoDisklet',
      summary: 'List repo contents',
      method: 'GET',
      path: '/admin/repo-list',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-repo-list',
          usage: 'admin-repo-list <syncKey> --data-key=<key> [--path=<path>]',
          flags: [
            { flag: '--data-key=<key>', maps: 'dataKey', target: 'query' },
            { flag: '--path=<path>', maps: 'path', target: 'query' }
          ],
          example: 'edge-cli -t admin-repo-list SYNCKEY --data-key=DATAKEY'
        }
      ],
      query: [
        { ...syncKey, required: true },
        { ...dataKey, required: true },
        { name: 'path', schema: s.string(), default: '"" (repo root)' }
      ],
      success: {
        status: 200,
        schema: s.object([
          f(
            'listing',
            s.map(s.string({ enum: ['file', 'folder'] })),
            'Path to entry type.'
          )
        ])
      },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'adminGetRepoFile',
      coreCall: 'context.$internalStuff.getRepoDisklet',
      summary: 'Read a repo file',
      method: 'GET',
      path: '/admin/repo-get',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-repo-get',
          usage: 'admin-repo-get <syncKey> --data-key=<key> --path=<path>',
          flags: [
            { flag: '--data-key=<key>', maps: 'dataKey', target: 'query' },
            { flag: '--path=<path>', maps: 'path', target: 'query' }
          ],
          example:
            'edge-cli -t admin-repo-get SYNCKEY --data-key=DATAKEY --path=Settings.json'
        }
      ],
      query: [
        { ...syncKey, required: true },
        { ...dataKey, required: true },
        { name: 'path', schema: s.string(), required: true }
      ],
      success: { status: 200, schema: s.object([f('text', s.string())]) },
      errors: ['NOT_FOUND', 'BAD_REQUEST']
    }),

    endpoint({
      id: 'adminSetRepoFile',
      coreCall: 'context.$internalStuff.getRepoDisklet',
      summary: 'Write a repo file',
      description:
        '**Writes directly into a synced repo,** bypassing every core-level invariant. A malformed write can break the account for real clients.',
      method: 'POST',
      path: '/admin/repo-set',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-repo-set',
          usage:
            'admin-repo-set <syncKey> --data-key=<key> --path=<path> --text=<text>',
          flags: [
            { flag: '--data-key=<key>', maps: 'dataKey', target: 'body' },
            { flag: '--path=<path>', maps: 'path', target: 'body' },
            { flag: '--text=<text>', maps: 'text', target: 'body' }
          ],
          example: `edge-cli -t admin-repo-set SYNCKEY --data-key=DATAKEY --path=a/b.json --text='{}'`
        }
      ],
      body: s.object([
        f('syncKey', s.string({ example: 'SYNCKEY' }), 'Base58 repo sync key.'),
        f('dataKey', s.string({ example: 'DATAKEY' }), 'Base58 repo data key.'),
        f('path', s.string()),
        f('text', s.string())
      ]),
      success: { status: 204 },
      errors: ['BAD_REQUEST']
    }),

    endpoint({
      id: 'adminDeleteRepoFile',
      coreCall: 'context.$internalStuff.getRepoDisklet',
      summary: 'Delete a repo file',
      description: '**Destructive** and not undoable from this API.',
      method: 'POST',
      path: '/admin/repo-delete',
      source: 'src/cli/engine/routes/admin.ts',
      cli: [
        {
          command: 'admin-repo-delete',
          usage: 'admin-repo-delete <syncKey> --data-key=<key> --path=<path>',
          flags: [
            { flag: '--data-key=<key>', maps: 'dataKey', target: 'query' },
            { flag: '--path=<path>', maps: 'path', target: 'query' }
          ],
          example:
            'edge-cli -t admin-repo-delete SYNCKEY --data-key=DATAKEY --path=a/b.json'
        }
      ],
      body: s.object([
        f('syncKey', s.string({ example: 'SYNCKEY' }), 'Base58 repo sync key.'),
        f('dataKey', s.string({ example: 'DATAKEY' }), 'Base58 repo data key.'),
        f('path', s.string())
      ]),
      success: { status: 204 },
      errors: ['BAD_REQUEST']
    })
  ]
})
