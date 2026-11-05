import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import type { EdgeCurrencyWallet } from 'edge-core-js'

import { fetchDfxSessionQuery } from '../../../plugins/ramps/dfx/dfxSession'

const MESSAGE = 'By_signing_this_message,_you_confirm_ownership'

interface FetchCall {
  url: string
  body?: unknown
}

let fetchCalls: FetchCall[] = []
let authStatus = 201
let signBlockchains: string[] = []
const realFetch = global.fetch
const realWarn = console.warn

const textResponse = (status: number, body: unknown): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  } as unknown as Response)

const makeWallet = (
  pluginId: string,
  addresses: Array<{ addressType: string; publicAddress: string }>
): {
  wallet: EdgeCurrencyWallet
  signMessage: jest.Mock<(message: string, opts?: unknown) => Promise<string>>
  signBytes: jest.Mock<(bytes: Uint8Array) => Promise<string>>
} => {
  const signMessage = jest.fn(
    async (message: string, opts?: unknown) => 'sig-' + message
  )
  const signBytes = jest.fn(
    async (bytes: Uint8Array) => '0xsig-' + Buffer.from(bytes).toString('utf8')
  )
  const wallet = {
    currencyInfo: { pluginId },
    getAddresses: async () => addresses,
    signMessage,
    signBytes
  } as unknown as EdgeCurrencyWallet
  return { wallet, signMessage, signBytes }
}

beforeEach(() => {
  fetchCalls = []
  authStatus = 201
  signBlockchains = ['Bitcoin']
  console.warn = jest.fn()
  global.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input)
    const body =
      init?.body == null ? undefined : JSON.parse(init.body as string)
    fetchCalls.push({ url, body })
    if (url.includes('/auth/signMessage')) {
      return textResponse(200, {
        message: MESSAGE,
        blockchains: signBlockchains
      })
    }
    if (authStatus !== 201) {
      return textResponse(authStatus, { message: 'Forbidden' })
    }
    return textResponse(201, { accessToken: 'jwt-token' })
  }) as typeof fetch
})

afterEach(() => {
  global.fetch = realFetch
  console.warn = realWarn
})

describe('fetchDfxSessionQuery', () => {
  it('logs a bitcoin wallet in with its segwit address', async () => {
    const { wallet, signMessage } = makeWallet('bitcoin', [
      { addressType: 'publicAddress', publicAddress: '1legacy' },
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    const query = await fetchDfxSessionQuery({
      direction: 'buy',
      wallet,
      walletName: 'Edge'
    })

    expect(query).toEqual({
      session: 'jwt-token',
      blockchain: 'Bitcoin',
      'asset-out': 'BTC'
    })
    expect(fetchCalls[0].url).toBe(
      'https://api.dfx.swiss/v1/auth/signMessage?address=bc1segwit'
    )
    expect(signMessage).toHaveBeenCalledWith(MESSAGE, {
      otherParams: { publicAddress: 'bc1segwit' }
    })
    expect(fetchCalls[1]).toEqual({
      url: 'https://api.dfx.swiss/v1/auth',
      body: {
        address: 'bc1segwit',
        signature: 'sig-' + MESSAGE,
        wallet: 'Edge'
      }
    })
  })

  it('signs the message bytes on EVM chains and selects the sell asset', async () => {
    signBlockchains = ['Ethereum', 'Polygon', 'Base']
    const { wallet, signMessage, signBytes } = makeWallet('polygon', [
      { addressType: 'publicAddress', publicAddress: '0xabc' }
    ])

    const query = await fetchDfxSessionQuery({
      direction: 'sell',
      wallet,
      walletName: 'Edge'
    })

    expect(query).toEqual({
      session: 'jwt-token',
      blockchain: 'Polygon',
      'asset-in': 'POL'
    })
    expect(signMessage).not.toHaveBeenCalled()
    expect(Buffer.from(signBytes.mock.calls[0][0]).toString('utf8')).toBe(
      MESSAGE
    )
    expect(fetchCalls[1].body).toEqual({
      address: '0xabc',
      signature: '0xsig-' + MESSAGE,
      wallet: 'Edge'
    })
  })

  it('skips chains without a session login', async () => {
    const { wallet, signMessage } = makeWallet('solana', [
      { addressType: 'publicAddress', publicAddress: 'So1ana' }
    ])

    const query = await fetchDfxSessionQuery({
      direction: 'buy',
      wallet,
      walletName: 'Edge'
    })

    expect(query).toBeUndefined()
    expect(fetchCalls).toHaveLength(0)
    expect(signMessage).not.toHaveBeenCalled()
  })

  it('falls back when DFX rejects the login', async () => {
    authStatus = 403
    const { wallet } = makeWallet('bitcoin', [
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    const query = await fetchDfxSessionQuery({
      direction: 'buy',
      wallet,
      walletName: 'Edge'
    })

    expect(query).toBeUndefined()
    expect(console.warn).toHaveBeenCalled()
  })

  it('falls back when DFX does not accept the address on the chain', async () => {
    signBlockchains = ['Ethereum']
    const { wallet, signBytes } = makeWallet('base', [
      { addressType: 'publicAddress', publicAddress: '0xabc' }
    ])

    const query = await fetchDfxSessionQuery({
      direction: 'buy',
      wallet,
      walletName: 'Edge'
    })

    expect(query).toBeUndefined()
    expect(signBytes).not.toHaveBeenCalled()
  })

  it('falls back when DFX does not answer in time', async () => {
    jest.useFakeTimers()
    try {
      global.fetch = (async () =>
        await new Promise<Response>(() => {})) as typeof fetch
      const { wallet, signMessage } = makeWallet('bitcoin', [
        { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
      ])

      const pending = fetchDfxSessionQuery({
        direction: 'buy',
        wallet,
        walletName: 'Edge'
      })
      await jest.advanceTimersByTimeAsync(10000)

      expect(await pending).toBeUndefined()
      expect(signMessage).not.toHaveBeenCalled()
      expect(console.warn).toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})
