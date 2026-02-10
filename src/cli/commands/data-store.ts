import { command, UsageError } from '../command'
import { requireAccount } from '../util/session'

command(
  'data-store-list',
  {
    usage: '[<store-id>]',
    help: 'Lists the either the data stores in an account, or the items within a store',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 0 && argv.length !== 1) throw new UsageError(this)
    const account = requireAccount(session)
    const storeId = argv[0]

    if (storeId != null) {
      await account.dataStore.listItemIds(storeId).then(names => {
        console.log(names)
      })
    } else {
      await account.dataStore.listStoreIds().then(names => {
        console.log(names)
      })
    }
  }
)

command(
  'data-store-delete',
  {
    usage: '<store-id> [<item-name>]',
    help: 'Deletes the either a single item, or an entire data store',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 1 && argv.length !== 2) throw new UsageError(this)
    const account = requireAccount(session)
    const storeId = argv[0]
    const itemId = argv[1]

    if (itemId != null) {
      await account.dataStore.deleteItem(storeId, itemId)
    } else {
      await account.dataStore.deleteStore(storeId)
    }
  }
)

command(
  'data-store-get',
  {
    usage: '<store-id> <item-name>',
    help: 'Gets an item from a data store',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 2) throw new UsageError(this)
    const account = requireAccount(session)
    const storeId = argv[0]
    const itemId = argv[1]

    await account.dataStore.getItem(storeId, itemId).then(text => {
      console.log(text)
    })
  }
)

command(
  'data-store-set',
  {
    usage: '<store-id> <item-name> <text>',
    help: 'Puts an into a data store',
    needsAccount: true
  },
  async function (console, session, argv) {
    if (argv.length !== 3) throw new UsageError(this)
    const account = requireAccount(session)
    const storeId = argv[0]
    const itemId = argv[1]
    const text = argv[2]

    await account.dataStore.setItem(storeId, itemId, text)
  }
)
