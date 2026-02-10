import type { EdgeWalletStates } from 'edge-core-js'

import { command, UsageError } from '../command'
import { requireAccount } from '../util/session'

command(
  'key-list',
  {
    help: 'Lists the keys in an account',
    needsAccount: true
  },
  function (console, session, argv) {
    if (argv.length !== 0) throw new UsageError(this)
    const account = requireAccount(session)

    console.log(account.allKeys)
  }
)

command(
  'key-add',
  {
    help: 'Attaches a key to an account',
    usage: '<key-info-json>',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const keyInfo = JSON.parse(argv[0]) as {
      type?: string
      id?: string
      keys?: Record<string, string>
    }

    if (keyInfo.type == null) {
      throw new UsageError(this, 'Missing `type` field')
    }
    if (keyInfo.id == null) {
      throw new UsageError(this, 'Missing `id` field')
    }
    if (keyInfo.keys == null) {
      throw new UsageError(this, 'Missing `keys` field')
    }

    await account.createWallet(keyInfo.type, keyInfo.keys)
  }
)

command(
  'key-get',
  {
    help: 'Reads a raw private key',
    usage: '<wallet-id>',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const [walletId] = argv

    const raw = await account.getRawPrivateKey(walletId)
    console.log(raw)
  }
)

command(
  'key-undelete',
  {
    help: "Removes a key's deleted flag",
    usage: '<wallet-id>',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const [walletId] = argv

    const opts: EdgeWalletStates = {}
    opts[walletId] = { deleted: false }
    await account.changeWalletStates(opts)
  }
)
