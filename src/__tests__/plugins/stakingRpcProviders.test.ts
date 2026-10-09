import { beforeAll, describe, expect, it, jest } from '@jest/globals'
import { ethers } from 'ethers'

import { makeStakingProvider } from '../../plugins/stake-plugins/util/rpcProviders'

type Send = (method: string, params: unknown[]) => Promise<unknown>

const network = { chainId: 10, name: 'optimism' }
const call = {
  to: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
  data: '0x18160ddd'
}
const callResult = '0x' + '00'.repeat(31) + '2a'

/** A node that answers every request. */
const healthy: Send = async method =>
  method === 'eth_blockNumber' ? '0x10' : callResult

/** A node that never answers. */
const hung: Send = async () => await new Promise(() => {})

/** What ethers' fetchJson throws once a node answers HTTP 429. */
const httpRateLimited: Send = async () => {
  throw ethers.logger.makeError('bad response', ethers.errors.SERVER_ERROR, {
    status: 429,
    body: 'Too Many Requests'
  })
}

/** What ethers' fetchJson throws for a JSON-RPC error inside an HTTP 200. */
const makeRpcError = (message: string): Error =>
  ethers.logger.makeError(
    'processing response error',
    ethers.errors.SERVER_ERROR,
    {
      body: JSON.stringify({ error: { code: -32005, message } }),
      error: { code: -32005, message }
    }
  )

const rpcRateLimited: Send = async () => {
  throw makeRpcError('rate limit exceeded')
}

/** A node that is up, but the contract call reverts without data. */
const reverting: Send = async method => {
  if (method === 'eth_blockNumber') return '0x10'
  throw makeRpcError('execution reverted')
}

/**
 * Builds the provider over stubbed nodes and records every JSON-RPC method
 * they were asked for, prefixed with the node's index.
 */
const makeProvider = (
  nodes: Send[]
): { provider: ethers.providers.BaseProvider; requests: string[] } => {
  const requests: string[] = []
  const provider = makeStakingProvider(
    nodes.map((_, i) => `https://node${i}.invalid`),
    network
  )
  const { nodes: stubbed } = provider as unknown as {
    nodes: ethers.providers.JsonRpcProvider[]
  }
  stubbed.forEach((node, i) => {
    node.send = async (method: string, params: unknown[]) => {
      requests.push(`${i}:${method}`)
      return await nodes[i](method, params)
    }
  })
  return { provider, requests }
}

describe('makeStakingProvider', () => {
  // The provider schedules its stall checks with real timers:
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('moves to another node as soon as one is rate limited over HTTP', async () => {
    const { provider } = makeProvider([httpRateLimited, healthy])
    const start = Date.now()
    expect(await provider.call(call)).toBe(callResult)
    expect(Date.now() - start).toBeLessThan(1000)
  })

  it('moves to another node when one returns a rate-limit RPC error', async () => {
    const { provider } = makeProvider([rpcRateLimited, healthy])
    expect(await provider.call(call)).toBe(callResult)
  })

  it('also asks another node when one stalls', async () => {
    const { provider } = makeProvider([hung, healthy])
    expect(await provider.call(call)).toBe(callResult)
  }, 10000)

  it('reports a contract revert instead of asking another node', async () => {
    const { provider, requests } = makeProvider([reverting, reverting])
    await expect(provider.call(call)).rejects.toMatchObject({
      code: ethers.errors.CALL_EXCEPTION
    })
    expect(requests.filter(r => r.endsWith('eth_call'))).toHaveLength(1)
  })

  it('fails with the last error when every node fails', async () => {
    const { provider } = makeProvider([httpRateLimited, httpRateLimited])
    await expect(provider.getBlockNumber()).rejects.toMatchObject({
      code: ethers.errors.SERVER_ERROR
    })
  })

  it('sends a transaction to every node', async () => {
    const wallet = ethers.Wallet.createRandom()
    const signed = await wallet.signTransaction({
      chainId: network.chainId,
      gasLimit: 21000,
      gasPrice: 1,
      nonce: 0,
      to: call.to,
      value: 0
    })
    const hash = ethers.utils.keccak256(signed)
    const accepting: Send = async method =>
      method === 'eth_blockNumber' ? '0x10' : hash
    const { provider, requests } = makeProvider([
      httpRateLimited,
      accepting,
      accepting
    ])

    const response = await provider.sendTransaction(signed)
    expect(response.hash).toBe(hash)
    expect(requests.filter(r => r.endsWith('eth_sendRawTransaction'))).toEqual(
      expect.arrayContaining([
        '0:eth_sendRawTransaction',
        '1:eth_sendRawTransaction',
        '2:eth_sendRawTransaction'
      ])
    )
  })

  it('stops asking a node first right after it fails', async () => {
    const { provider, requests } = makeProvider([httpRateLimited, healthy])
    for (let i = 0; i < 10; ++i) await provider.call(call)
    // Only the first request can reach the rate-limited node before the
    // healthy one:
    expect(requests.filter(r => r === '0:eth_call').length).toBeLessThan(2)
  })

  it('never asks a node for the chain id', async () => {
    const { provider, requests } = makeProvider([healthy, healthy])
    await provider.call(call)
    await provider.call(call)
    expect(
      requests.filter(
        r => r.endsWith('eth_chainId') || r.endsWith('net_version')
      )
    ).toEqual([])
  })
})
