# Bitcoin Engine

This design is based on everything we learned from writing the C++ Bitcoin engine. The C++ engine is heavily battle-tested, and gives good results even under terrible conditions. This design attempts to keep those good attributes while also being faster to sync balances.

## On-Disk Data

The engine keeps its main data structures on disk. This way, it can pick up exactly where it left off, even if the app is shut down.

### Address Cache

This cache stores the following information on a per-address basis:

* `txids` - An array of txids as returned by Stratum `get_history`. Used for displaying transaction history.
* `txidStratumHash` - When subscribing to an address, stratum sends back a state hash. If that hash differs from `txidStratumHash`, it means the `txids` list is out of date, and needs to be fetched. Once the fetch completes, it should update both the `txidStratumHash` and `txids` at the same time to indicate that the `txids` list is up-to-date.
* `utxos` - An array of utxos as returned by Stratum `listunspent`. Used for displaying balances & for spending.
* `utxoStratumHash` - The same as `txidStratumHash`, but for the `utxos` list.

This cache represents addresses using script hashes, like how Stratum does it. The information needed to retrieve the private key (derivation path / xpub) is stored in the `path` member.

```js
interface AddressCache {
  addresses: {
    [scriptHash: string]: {
      txids: Array<string>,
      txidStratumHash: string,

      utxos: Array<{
        txid: string, // tx_hash from Stratum
        index: number, // tx_pos from Stratum
        value: number // Satoshis fit in a number
      }>,
      utxoStratumHash: string,

      used: true, // Set by `addGapLimitAddress`
      displayAddress: string // base58 or other wallet-ready format
      path: {} // TODO: Define the contents of this member.
    }
  };
}
```

### Tx Cache

This is just a mapping from txids to raw tx bytes.

This cache can be shared between wallets for the same blockchain (and maybe even forks), since it is likely that a transaction will exist in multiple places.

We only want to load these on-demand. We need to load unspent transactions when we go to sign a spend, and we need to load other transactions as the user scrolls through their history. Otherwise, we can just leave these on disk.

TODO: Find a nice random-access on-disk data structure for storing these. For now, maybe just use a giant JSON.

```js
interface TxCache {
  txs: {
    [txid: string]: string // hex string data
  }
}
```

### Tx Height Cache

Stratum returns transaction heights when querying addresses. As the heights come in, we stash them this data structure, indexed by txid for easy lookup.

We may eventually choose to put merkle proofs in this data structure as well.

```js
interface TxHeightCache {
  txs: {
    [txid: string]: {
      height: number,
      firstSeen: number // Timestamp for unconfirmed stuff
    }
  }
}
```

### Header Cache

This cache maps from block heights to block headers. It also contains a single integer, `height`, which gives the last chain height. We don't need to store raw header bytes, since we only care about timestamps.

If we eventually go full-SPV, we can add the merkle root too. As we verify the header chain in SPV mode, we can just keep these two values and drop everything else to save space.

This cache can be shared between all wallets on the same blockchain.

```js
interface HeaderCache {
  height: number;
  headers: {
    [height: number]: {
      timestamp: number
    }
  }
}
```

### Server Cache

This cache maps from server URI's to scores. Paul knows more about this algorithm.

```js
interface ServerCache {
  servers: {
    [uri: string]: {
      score: number,
      latency: number // ms
    }
  }
}
```

## In-memory Data Structures

Although the goal is to keep as much connection information on disk, information about the current conntections needs to stay in memory, since it's not relevant from one session to the next.

### Connections

The application has a list of current connections:

```js
// Property of the wallet engine:
const connections: {
  [uri: string]: StratumConnection
} = {}
```

The basic idea is to keep a pool of connections open. If the pool gets low (`this.connections.length < 5` or such), we go to the server list and pick some new URI's to fill up the pool.

### Server States

As we talk to the server, we get a sense of its current state. This data structure records our findings.

```js
// Property of the wallet engine:
const serverStates: {
  [uri: string]: {
    // The server block height:
    // undefined - never subscribed
    // 0 - subscribed but no results yet
    // number - subscription result
    height: number | void,

    // Address subscriptions:
    addresses: {
      [scriptHash: string]: {
        // We have an `undefined` hash once we request a subscription,
        // but the initial hash hasn't come back yet.
        // Stratum sometimes returns `null` hashes as well:
        hash: string | null | void,
        fetchingUtxos: boolean,
        fetchingTxids: boolean,
        // Timestamp of the last hash change.
        // The server with the latest timestamp "owns" an address for the sake
        // of fetching utxos and txids:
        lastUpdate: number
      }
    },

    // All txids this server knows about (from subscribes or whatever):
    // Servers that know about txids are eligible to fetch those txs.
    // If no server knows about a txid, anybody can try fetching it,
    // but there is no penalty for failing:
    txids: Set<string>
  }
} = {}
```

I suppose this information could be folded into the connection object, but the old system had it separated out since we didn't want to duplicate it between Stratum and libbitcoin connections. I think it's nice to keep the actual connections "dumb".

### Tx State

This data structure tracks which all transactions that are relevant to this wallet. Once a server starts fetching a transaction, it will set `fetching` to true so other servers know not to duplicate work.

```js
// Property of the wallet engine:
const txStates: {
  [txid: string]: {
    fetching: boolean
  }
} = {}
```

If a server fails to fetch a txid on this list, its onFail callback will unset `fetching`, allowing other servers to attempt the fetch.

Everytime we fetch an address utxo or txid list, we need to ensure all txids on that list are added to this table.

### Missing Txids

```js
const missingTxs: Set<string>
```
List of txids that are in TxState but not in TxCache. These are txids that we know about from stratum address history but we have not yet fetched the tx data. Any routine that modified TxState or TxCache must also keep this list up-to-date.

## Algorithms

### Make Engine

This just loads all caches from disk (if any). If there aren't any caches, derive a few addresses and write them out to the address cache.

### Start Engine

First, here's a helper funciton:

```js
function refillServers () {
  while (Object.keys(connections).length < 5) {
    const uri = pickServerUri(serverCache, connections)
    const callbacks = {
      onOpen () {
        console.log(`Connected to ${uri}`)
      },

      onClose () {
        console.log(`Disconnected from ${uri}`)
        delete connections[uri]
        if (engineStarted) refillServers()
      },

      onQueueSpace () {
        return pickNextTask(uri)
      }
    }

    connections[uri] = new StratumConnection(uri, { callbacks })
  }
}
```

Now we can do `startEngine`:

```js
startEngine () {
  this.engineStarted = true
  refillServers()
}
```

### Stop Engine

```js
stopEngine () {
  this.engineStarted = false
  for (const uri of Object.keys(connections)) {
    connections[uri].close()
    delete connections[uri]
  }
}
```

### Get Next Task

This is where most of the work happens. Whenever a Stratum connection has space in its queue, it fires the `onQueueSpace` callback. The goal is to return the next most valuable piece of work we can be doing with that server.

1. If we don't know a server's block height, fetch that. If the height is too low, we might want to disconnect.
2. If we know about txids that are not in the cache, fetch those. This is pre-calculated as `missingTxs`. We should only fetch transactions where `txStates[txid].fetching` is false, and where `serverStates[uri].txids[txid]` exists. If no server has the txid in `serverStates[uri].txids`, then the second rule doesn't apply.
3. If we have not subscribed to some addresses, subscribe. These are the addresses that exist in the address cache but don't exist in `serverStates[uri]`.
4. If an address has a different `utxoStratumHash` from our `serverStates[uri].addresses[address].hash`, *and* our `serverStates[uri].addresses[address].lastUpdate` is the newest of all servers, fetch the utxo set for this address.
5. If an address has a different `txidStratumHash` from our `serverStates[uri].addresses[address].hash`, *and* our `serverStates[uri].addresses[address].lastUpdate` is the newest of all servers, fetch the txid list for this address.
6. If we have heights in the tx height cache that do not have corresponding headers, go grab those.

### Get Block Height

Just return this out of the block header cache.

### Get Balance

Iterate over the utxo set and add their balances. Only include utxos whose txids are present in the TxCache.

### Get Transactions

All the txids relevant to this wallet are in the `txStates` structure as keys. Using this list, plus the tx height cache, we can get a list of txids sorted by date. Only include transactions that are in the trasaction cache *and* whose relevant inputs are in the transaction cache. We know an input is relevant if its txid is in the `txStates` table.

Now, based on the range given in the query, we can figure out exactly which txids we need to fetch. We set up some promises for the disk accesses, and return a `Promise.all` for those. Need to parse raw tx bytes into AbcTransaction

parseTxData(tx bytes) => (input txids, output addresses + balances)

1. Get txids of 'inputs' of txdata
2. Correlate txids with relevance list
3. Given relevant inputs, balances of relevant input outputs, balances of our outputs, calculate sum for wallet balance
4. Extract addresses from relevant input outputs, put those into ownInputAdresses

getOutputBalance(rawTxbytes, index) => number

### Get Fresh Address

Get the latest address where the `used` is false and where there are no txids or utxos in the address cache.

### Add Gap Limit Addresses

For every entry in the address cache that has an entry in gap limit list, set `done` to true and then derive new addresses to maintain our buffer. Once this loop has finished, all the addresses on the gap limit list should be consumed. If they are not, it means something has gone terribly wrong in metadata land, and we should somehow warn the user that funds may be missing (since we have metadata for unknown addresses).

### Address is Used

Just go to the address cache and return true if `utxos` and `txids` are empty, and `done` is false.

### Spend

Spin up a fresh bcoin instance. Jam all the utxo transactions into it (using the get balance rules), along with the addresses that have utxos. Do the spend. If we don't want to use bcoin, replace this with any library of your choice. The sign and broadcast should be pretty straightforward based on the library choice.

If we are building the transaction manually using primitives, the algorithm is to pick a set of utxos that add up to the amount being spent, and then calculate the fee. If there is enough change to cover the fee, we are done. Otherwise, add the calculated fee to the amount being spent, and repeat. If you use up all the inputs in the wallet, then there is just no way to do the spend. Return an insufficient funds error.

Broadcast transaction sends the signed transaction to all connections. Broadcast should return a failure if:

1. Any connection reports that the transaction is a double spend.
OR
2. All connections fail to broadcast.

The `save` step needs to identify which address is the change address, and manually insert that into the utxo list. It also needs to update the `txids` lists for all input and change addresses. It also needs to add the transaction itself to the transaction cache. The transaction is clearly unconfirmed to start, so the tx height cache would just receive the current time.

## `StratumConnection` Object

Here is the `StratumConnection` object. There is one of these per URI that is currently connected.

```js
class StratumConnection {
  constructor (uri: string, options: StratumOptions) {}
  open () {}
  close () {}
  wakeup () {}
  submitTask (task: StratumTask) {}

  // The connection's URI:
  get uri (): string {}
}

interface StratumOptions {
  callbacks: StratumCallbacks,
  timeout?: number, // seconds, defaults to 30
  queueSize?: number // defaults to 10
}

interface StratumCallbacks {
  +onOpen: (uri: string) => void;
  +onClose: (uri: string, error?: Error) => void;
  +onQueueSpace: (uri: string) => StratumTask | void;
}
```

The `StratumConnection` object receives three callbacks, `onOpen`, `onClose`, and `onQueueSpace`. The `onOpen` callback is basically unused in this design, but represents a successful connection. It may be useful for logging or server scoring, though. The `onClose` callback happens whenever the socket disconnects, either because of an error or because the user manually called `close`.

### Queue Logic

The `onQueueSpace` callback is where the work happens. Internally, the Stratum connection maintains a list of outgoing requests. Once a reply comes back, the connection removes the outgoing request from the list and calls `onQueueSpace`. If `onQueueSpace` returns a `StratumTask`, the connection adds the task to the queue. It keeps doing this until the queue is full again. Otherwise, if `onQueueSpace` returns `undefined`, there is no more work to do.

After things have settled down for a while and there is no more work to do, the connection's queue will be empty. If the user does something that creates more work, such as spending money or marking an address as used, it should call `wakeup` to re-start things. The `wakeup` function just calls `onQueueSpace` if there is room in the queue. It is safe to call `wakeup` at any time. The connection should call `onQueueSpace` at start-up time as well.

The `submitTask` method bypasses the normal queue logic, and can actually over-fill the queue. This must never be used for normal address or transaction work, since it is too dangerous. It only exists to help with spends, which are high-priority tasks that override all other concerns.

### Tasks

```js
interface StratumTask {
  method: string;
  params: Array<any>;
  onDone (params: Array<any>): void;
  onFail (): void;
}
```

The `method` and `params` fields are just the raw Stratum message fields. Since we don't want user code messing with these, the `StratumConnection` should have several static helper methods for creating different `StratumTask` types:

```js
function fetchAddressHistory (
  address: string,
  onDone: (txids: Array<string>) => void,
  onFail: () => void
): StratumTask {
  return {
    method: 'blockchain.address.get_history'
    params: [address],
    onDone (params: Array<any>) {
      // Validate the reply params...
      onDone(validateAndTranslateResults(params))
    },
    onFail
  }
}
```

The `onDone` callback should be invoked when the server sends a response. For address or block height subscriptions, it will be called on every subscription update as well.

The `onFail` callback should be called if the request never completes, either because of a server error or explicit disconnection. It is mainly needed to clean up various flags, such as `txStates[txid].fetching`.

* fetchServerVersion
* fetchEstimateFee
* fetchBlockHeader
* fetchTransaction
* fetchScriptHashHistory
* fetchScripthashUtxo
* subscribeScriptHash
* broadcastTx
