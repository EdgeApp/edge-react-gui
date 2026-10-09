import { ethers } from 'ethers'

interface StakingRpcChain {
  chainId: number
  urls: string[]
}

/**
 * Public RPC nodes the stake plugins read chain state from, keyed by the
 * parent pluginId of the policies that use them.
 *
 * Chosen from chainlist.org for answering a burst of `eth_call`s without rate
 * limiting, agreeing with each other on the same block, and needing no API
 * key. Every node is listed there as doing no tracking, except the chains' own
 * first-party nodes (mainnet.optimism.io, the Fantom Foundation and GLIF
 * nodes), which chainlist has no tracking label for.
 */
const stakingRpcChains: Record<string, StakingRpcChain> = {
  ethereum: {
    chainId: 1,
    urls: [
      'https://eth.drpc.org',
      'https://ethereum-rpc.publicnode.com',
      'https://rpc.mevblocker.io',
      'https://rpc-eth.blockmachine.io',
      'https://eth.api.pocket.network'
    ]
  },
  fantom: {
    chainId: 250,
    urls: [
      'https://fantom.drpc.org',
      'https://fantom.api.pocket.network',
      'https://rpcapi.fantom.network',
      'https://rpc3.fantom.network'
    ]
  },
  filecoinfevm: {
    chainId: 314,
    urls: ['https://api.node.glif.io/rpc/v1', 'https://filecoin.drpc.org']
  },
  filecoinfevmcalibration: {
    chainId: 314159,
    urls: [
      'https://api.calibration.node.glif.io/rpc/v1',
      'https://filecoin-calibration.drpc.org'
    ]
  },
  // Holesky has been shut down, and no public node answers for it any more:
  holesky: {
    chainId: 17000,
    urls: [
      'https://ethereum-holesky-rpc.publicnode.com',
      'https://1rpc.io/holesky'
    ]
  },
  optimism: {
    chainId: 10,
    urls: [
      'https://optimism.drpc.org',
      'https://optimism-rpc.publicnode.com',
      'https://mainnet.optimism.io',
      'https://rpc-optimism.blockmachine.io',
      'https://op.api.pocket.network'
    ]
  }
}

/**
 * How long a node gets to answer before the same request also goes to the
 * next one. A node that fails moves the request on straight away.
 */
const STALL_TIMEOUT_MS = 2000

/**
 * ethers otherwise waits up to two minutes for a response, and retries a rate
 * limited (HTTP 429) request up to 12 times with exponential back-off. Both
 * hold a request on a node that cannot serve it while other nodes could.
 */
const REQUEST_TIMEOUT_MS = 15000

/**
 * A node that failed goes to the back of the order for this long, so a node
 * that is rate limiting gets a rest instead of the next request.
 */
const COOLDOWN_MS = 10000

/**
 * Errors that are the chain's answer rather than a node failing, so another
 * node would give the same one. This is the list ethers' FallbackProvider
 * treats the same way.
 */
const answerErrorCodes: string[] = [
  ethers.errors.CALL_EXCEPTION,
  ethers.errors.INSUFFICIENT_FUNDS,
  ethers.errors.NONCE_EXPIRED,
  ethers.errors.REPLACEMENT_UNDERPRICED,
  ethers.errors.UNPREDICTABLE_GAS_LIMIT
]

const isAnswerError = (error: unknown): boolean =>
  typeof error === 'object' &&
  error != null &&
  answerErrorCodes.includes((error as { code?: string }).code ?? '')

/**
 * One node. Its network is fixed up front, so it never asks for `eth_chainId`
 * (a plain `JsonRpcProvider` asks before nearly every request).
 *
 * ethers turns any failed `eth_call` without revert data into a
 * CALL_EXCEPTION, including a rate limit or a timeout. Rethrowing the
 * underlying error for anything that is not a revert keeps those from passing
 * as the contract's answer, so the request moves on to another node.
 */
class StakingRpcNode extends ethers.providers.StaticJsonRpcProvider {
  constructor(url: string, network: ethers.providers.Network) {
    super(
      {
        url,
        timeout: REQUEST_TIMEOUT_MS,
        throttleCallback: async () => false
      },
      network
    )
  }

  async perform(method: string, params: any): Promise<any> {
    try {
      return await super.perform(method, params)
    } catch (error: unknown) {
      const cause = getCallTransportError(method, error)
      throw cause ?? error
    }
  }
}

/**
 * Returns the underlying error when an `eth_call` CALL_EXCEPTION came from the
 * node or the network rather than from the contract reverting.
 */
const getCallTransportError = (method: string, error: unknown): unknown => {
  if (method !== 'call') return
  if (typeof error !== 'object' || error == null) return
  const {
    code,
    data,
    error: cause
  } = error as {
    code?: unknown
    data?: unknown
    error?: unknown
  }
  if (code !== ethers.errors.CALL_EXCEPTION || data !== '0x') return
  if (cause == null || /revert/i.test(describeError(cause))) return
  return cause
}

const describeError = (error: unknown): string => {
  if (typeof error !== 'object' || error == null) return String(error)
  const {
    body,
    error: inner,
    message
  } = error as {
    body?: unknown
    error?: { message?: unknown }
    message?: unknown
  }
  return [inner?.message, body, message]
    .filter(part => typeof part === 'string')
    .join(' ')
}

/**
 * Sends a request to one node at a time, in the given order. The next node
 * gets it when the current one fails, or alongside it when the current one
 * takes longer than `STALL_TIMEOUT_MS`. The first answer wins.
 */
const raceNodes = async <T>(
  nodes: StakingRpcNode[],
  request: (node: StakingRpcNode) => Promise<T>
): Promise<T> =>
  await new Promise<T>((resolve, reject) => {
    let nextIndex = 0
    let pending = 0
    let settled = false
    let lastError: unknown = new Error('No RPC nodes')
    let stallTimer: ReturnType<typeof setTimeout> | undefined

    const finish = (): void => {
      settled = true
      clearTimeout(stallTimer)
    }

    const startNext = (): void => {
      clearTimeout(stallTimer)
      if (settled) return
      if (nextIndex >= nodes.length) {
        if (pending === 0) {
          finish()
          reject(lastError)
        }
        return
      }

      const node = nodes[nextIndex++]
      ++pending
      stallTimer = setTimeout(startNext, STALL_TIMEOUT_MS)
      request(node).then(
        result => {
          if (settled) return
          finish()
          resolve(result)
        },
        (error: unknown) => {
          --pending
          if (settled) return
          if (isAnswerError(error)) {
            finish()
            reject(error)
            return
          }
          lastError = error
          startNext()
        }
      )
    }

    startNext()
  })

/**
 * Resolves with the first request to succeed. When they all fail, rejects
 * with the chain's answer if any node gave one, since that explains the
 * failure better than a node being down.
 */
const firstSuccess = async <T>(requests: Array<Promise<T>>): Promise<T> =>
  await new Promise<T>((resolve, reject) => {
    let remaining = requests.length
    let answerError: unknown
    let lastError: unknown = new Error('No RPC nodes')
    if (remaining === 0) reject(lastError)
    for (const request of requests) {
      request.then(resolve, (error: unknown) => {
        if (answerError == null && isAnswerError(error)) answerError = error
        lastError = error
        if (--remaining === 0) reject(answerError ?? lastError)
      })
    }
  })

const shuffle = <T>(items: T[]): T[] => {
  const out = [...items]
  for (let i = out.length - 1; i > 0; --i) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * A provider over a list of nodes. Each read goes to the nodes in a fresh
 * random order, so the load spreads across the list, with any node that failed
 * in the last `COOLDOWN_MS` moved to the back. It moves to the next node when
 * one fails or stalls. A transaction goes to every node, and the first one to
 * accept it wins.
 *
 * This replaces ethers' FallbackProvider, which counts a node that has already
 * failed as busy until its stall timeout ends. With nothing else to wait on,
 * its request loop spins synchronously for that whole time, freezing the JS
 * thread whenever a node fails.
 */
class StakingProvider extends ethers.providers.BaseProvider {
  readonly nodes: StakingRpcNode[]
  readonly staticNetwork: ethers.providers.Network
  readonly failedAt = new Map<StakingRpcNode, number>()

  constructor(urls: string[], network: ethers.providers.Network) {
    super(network)
    this.nodes = urls.map(url => new StakingRpcNode(url, network))
    this.staticNetwork = network
  }

  async detectNetwork(): Promise<ethers.providers.Network> {
    return this.staticNetwork
  }

  async perform(method: string, params: any): Promise<any> {
    if (method === 'sendTransaction') {
      return await firstSuccess(
        this.nodes.map(async node => await node.perform(method, params))
      )
    }
    const now = Date.now()
    const isCooling = (node: StakingRpcNode): boolean =>
      now - (this.failedAt.get(node) ?? -Infinity) < COOLDOWN_MS
    const shuffled = shuffle(this.nodes)
    const order = [
      ...shuffled.filter(node => !isCooling(node)),
      ...shuffled.filter(isCooling)
    ]

    return await raceNodes(order, async node => {
      try {
        return await node.perform(method, params)
      } catch (error: unknown) {
        if (!isAnswerError(error)) this.failedAt.set(node, Date.now())
        throw error
      }
    })
  }
}

export const makeStakingProvider = (
  urls: string[],
  network: ethers.providers.Network
): ethers.providers.BaseProvider => new StakingProvider(urls, network)

const providerCache = new Map<string, ethers.providers.BaseProvider>()

/**
 * Returns the provider the stake plugins share for a chain.
 */
export const getStakingProvider = (
  pluginId: string
): ethers.providers.BaseProvider => {
  const cached = providerCache.get(pluginId)
  if (cached != null) return cached

  const chain = stakingRpcChains[pluginId]
  if (chain == null) throw new Error(`No staking RPC nodes for ${pluginId}`)

  const provider = makeStakingProvider(chain.urls, {
    chainId: chain.chainId,
    name: pluginId
  })
  providerCache.set(pluginId, provider)
  return provider
}
