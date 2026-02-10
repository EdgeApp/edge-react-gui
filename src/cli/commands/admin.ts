import { asMaybe, asObject } from 'cleaners'
import { asBase64, asLoginRequestBody } from 'edge-core-js'
import hashjs from 'hash.js'
import { base16, base64 } from 'rfc4648'

import { command, UsageError } from '../command'
import { base58, utf8 } from '../util/encoding'
import { getInternalStuff } from '../util/internal'
import { requireContext } from '../util/session'

function hmacSha256(
  data: ArrayLike<number>,
  key: ArrayLike<number>
): Uint8Array {
  // @ts-expect-error hash.js types are incomplete
  const hmac = hashjs.hmac(hashjs.sha256, key)
  return Uint8Array.from(hmac.update(data).digest())
}

command(
  'admin-auth-fetch',
  {
    usage: '[<method>] <path> [<post-body>]',
    help: 'Visits the selected URI on the auth server',
    needsContext: true
  },
  async function (console, session, argv) {
    const internal = getInternalStuff(requireContext(session))
    switch (argv.length) {
      case 1: {
        await internal.authRequest('GET', argv[0], {}).then(reply => {
          console.log(reply)
        })
        return
      }
      case 2: {
        await internal
          .authRequest('POST', argv[0], asLoginRequestBody(JSON.parse(argv[1])))
          .then(reply => {
            console.log(reply)
          })
        return
      }
      case 3: {
        await internal
          .authRequest(
            argv[0],
            argv[1],
            asLoginRequestBody(JSON.parse(argv[2]))
          )
          .then(reply => {
            console.log(reply)
          })
        return
      }
      default:
        throw new UsageError(this)
    }
  }
)

command(
  'admin-filename-hash',
  {
    usage: '[dataKey] [txid]',
    help: 'Runs the filename hashing algorithm',
    needsContext: true
  },
  function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const dataKey = argv[0]
    const data = argv[1]

    console.log(
      base58.stringify(hmacSha256(utf8.parse(data), base64.parse(dataKey)))
    )
  }
)

command(
  'admin-repo-sync',
  {
    usage: '<sync-key>',
    help: 'Fetches the contents of a sync repo',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const syncKey = base16.parse(argv[0])

    const internal = getInternalStuff(requireContext(session))
    await internal.syncRepo(syncKey).then(results => {
      const changed = results.changes.length !== 0
      console.log(changed ? 'changed' : 'unchanged')
    })
  }
)

command(
  'admin-repo-list',
  {
    usage: '<sync-key> <data-key> [<path>]',
    help: 'Shows the contents of a sync repo folder',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length < 2 || argv.length > 3) throw new UsageError(this)
    const syncKey = base16.parse(argv[0])
    const dataKey = base16.parse(argv[1])
    const path = argv.length === 3 ? argv[2] : ''

    const internal = getInternalStuff(requireContext(session))
    const disklet = await internal.getRepoDisklet(syncKey, dataKey)
    await disklet.list(path).then(listing => {
      console.log(listing)
    })
  }
)

command(
  'admin-repo-set',
  {
    usage: '<sync-key> <data-key> <path> <value>',
    help: 'Writes a file to the sync repo',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 4) throw new UsageError(this)
    const syncKey = base16.parse(argv[0])
    const dataKey = base16.parse(argv[1])
    const path = argv[2]
    const value = argv[3]

    const internal = getInternalStuff(requireContext(session))
    const disklet = await internal.getRepoDisklet(syncKey, dataKey)
    await disklet.setText(path, value)
  }
)

command(
  'admin-repo-get',
  {
    usage: '<sync-key> <data-key> <path>',
    help: 'Reads a file from the sync repo',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 3) throw new UsageError(this)
    const syncKey = base16.parse(argv[0])
    const dataKey = base16.parse(argv[1])
    const path = argv[2]

    const internal = getInternalStuff(requireContext(session))
    const disklet = await internal.getRepoDisklet(syncKey, dataKey)
    await disklet.getText(path).then(text => {
      console.log(text)
    })
  }
)

command(
  'admin-lobby-create',
  {
    usage: '<request-json>',
    help: 'Puts the provided lobby request JSON on the auth server',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const lobbyRequest = JSON.parse(argv[0]) as Record<string, unknown>

    const internal = getInternalStuff(requireContext(session))
    const lobby = await internal.makeLobby(lobbyRequest)
    console.log(`Created lobby ${lobby.lobbyId}`)

    await new Promise((resolve, reject) => {
      lobby.on('error', reject)
      lobby.watch('replies', (replies: unknown[]) => {
        if (replies.length === 0) return
        console.log(JSON.stringify(replies[0], null, 2))
        lobby.close()
        resolve(undefined)
      })
    })
  }
)

command(
  'admin-lobby-fetch',
  {
    usage: '<lobbyId>',
    help: "Fetches a lobby's contents from the server",
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const lobbyId = argv[0]

    const internal = getInternalStuff(requireContext(session))
    await internal.fetchLobbyRequest(lobbyId).then(request => {
      console.log(JSON.stringify(request, null, 2))
    })
  }
)

command(
  'admin-lobby-reply',
  {
    usage: '<lobbyId> <reply-json>',
    help: 'Sends a reply to a lobby',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const lobbyId = argv[0]
    const lobbyReply = JSON.parse(argv[1]) as unknown

    const internal = getInternalStuff(requireContext(session))
    const request = await internal.fetchLobbyRequest(lobbyId)
    await internal.sendLobbyReply(lobbyId, request, lobbyReply)
  }
)

command(
  'admin-username-hash',
  {
    usage: '<username>',
    help: 'Hashes a username using scrypt',
    needsContext: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const context = requireContext(session)
    const username = context.fixUsername(argv[0])

    const internal = getInternalStuff(context)
    const hash = await internal.hashUsername(username)
    console.log('base64', base64.stringify(hash))
    console.log('base58', base58.stringify(hash))

    // Fetch the loginId too:
    const response = await internal
      .authRequest('POST', '/v2/login', {
        userId: hash
      })
      .catch((error: unknown) => {
        console.log(String(error))
      })
    const clean = asMaybe(asObject({ loginId: asBase64 }))(response)
    if (clean != null) {
      console.log('loginId base64', base64.stringify(clean.loginId))
      console.log('loginId base58', base58.stringify(clean.loginId))
    }
  }
)
