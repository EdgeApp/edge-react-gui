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
import { RampIpCountryError } from '../../../types/RampIpCountryError'
import { RampLoginError } from '../../../types/RampLoginError'
import {
  installFakeFetch,
  makeTextResponse
} from '../../../util/fake/fakeFetch'
import { translateError } from '../../../util/translateError'

// What the quote approval shows for a failed login, so the user tries again:
const LOGIN_FAILED = 'Failed to connect your wallet to DFX. Please try again.'

const MESSAGE_PREFIX =
  'By_signing_this_message,_you_confirm_that_you_are_the_sole_owner_of_the_provided_Blockchain_address._Your_ID:_'

// DFX's answer to a login from a blocked country, as its NestJS API sends it:
const IP_COUNTRY_BODY = {
  statusCode: 403,
  message: 'The country of IP address is not allowed',
  error: 'Forbidden'
}

let fakeFetch: ReturnType<typeof installFakeFetch>
let authStatus = 201
let authBody: unknown = {}
let signBlockchains: string[] = []
let signMessageText: ((address: string) => string) | undefined
const realWarn = console.warn

const makeWallet = (
  pluginId: string,
  addresses: Array<{ addressType: string; publicAddress: string }>
): {
  wallet: EdgeCurrencyWallet
  signMessage: jest.Mock<(message: string, opts?: unknown) => Promise<string>>
  signBytes: jest.Mock<(bytes: Uint8Array) => Promise<string>>
  getAddresses: jest.Mock<(opts: unknown) => Promise<typeof addresses>>
} => {
  const signMessage = jest.fn(
    async (message: string, opts?: unknown) => 'sig-' + message
  )
  const signBytes = jest.fn(
    async (bytes: Uint8Array) => '0xsig-' + Buffer.from(bytes).toString('utf8')
  )
  const getAddresses = jest.fn(async (opts: unknown) => addresses)
  const wallet = {
    currencyInfo: { pluginId },
    getAddresses,
    signMessage,
    signBytes
  } as unknown as EdgeCurrencyWallet
  return { wallet, signMessage, signBytes, getAddresses }
}

beforeEach(() => {
  authStatus = 201
  authBody = { statusCode: 403, message: 'Forbidden', error: 'Forbidden' }
  signBlockchains = ['Bitcoin']
  signMessageText = undefined
  console.warn = jest.fn()
  fakeFetch = installFakeFetch(({ url }) => {
    if (url.includes('/auth/signMessage')) {
      const address = decodeURIComponent(url.split('address=')[1])
      return makeTextResponse(200, {
        message: signMessageText?.(address) ?? MESSAGE_PREFIX + address,
        blockchains: signBlockchains
      })
    }
    if (authStatus !== 201) return makeTextResponse(authStatus, authBody)
    return makeTextResponse(201, { accessToken: 'jwt-token' })
  })
})

afterEach(() => {
  fakeFetch.restore()
  console.warn = realWarn
})

/** Logs the wallet in, expecting that to fail, and returns the error. */
const failLogin = async (wallet: EdgeCurrencyWallet): Promise<unknown> =>
  await fetchDfxSessionQuery({ wallet, walletName: 'Edge' }).then(
    () => new Error('The login succeeded'),
    (error: unknown) => error
  )

/**
 * Checks a failed login: the user is asked to try again, while logs and
 * error reports get the cause.
 */
const expectLoginError = (error: unknown, cause: string): void => {
  expect(error).toBeInstanceOf(RampLoginError)
  expect(translateError(error)).toBe(LOGIN_FAILED)
  expect(error).toMatchObject({ message: expect.stringContaining(cause) })
}

describe('fetchDfxSessionQuery', () => {
  it('logs a bitcoin wallet in with its first segwit address', async () => {
    const { wallet, signMessage, getAddresses } = makeWallet('bitcoin', [
      { addressType: 'publicAddress', publicAddress: '1legacy' },
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])
    const message = MESSAGE_PREFIX + 'bc1segwit'

    const query = await fetchDfxSessionQuery({ wallet, walletName: 'Edge' })

    expect(query).toEqual({ session: 'jwt-token' })
    expect(getAddresses).toHaveBeenCalledWith({ tokenId: null, forceIndex: 0 })
    expect(fakeFetch.calls[0].url).toBe(
      'https://api.dfx.swiss/v1/auth/signMessage?address=bc1segwit'
    )
    expect(signMessage).toHaveBeenCalledWith(message, {
      otherParams: { publicAddress: 'bc1segwit' }
    })
    expect(fakeFetch.calls[1]).toEqual({
      url: 'https://api.dfx.swiss/v1/auth',
      method: 'POST',
      body: {
        address: 'bc1segwit',
        signature: 'sig-' + message,
        wallet: 'Edge'
      }
    })
  })

  it('signs the message bytes on EVM chains', async () => {
    signBlockchains = ['Ethereum', 'Polygon', 'Base']
    const { wallet, signMessage, signBytes } = makeWallet('polygon', [
      { addressType: 'publicAddress', publicAddress: '0xabc' }
    ])
    const message = MESSAGE_PREFIX + '0xabc'

    const query = await fetchDfxSessionQuery({ wallet, walletName: 'Edge' })

    expect(query).toEqual({ session: 'jwt-token' })
    expect(signMessage).not.toHaveBeenCalled()
    expect(Buffer.from(signBytes.mock.calls[0][0]).toString('utf8')).toBe(
      message
    )
    expect(fakeFetch.calls[1].body).toEqual({
      address: '0xabc',
      signature: '0xsig-' + message,
      wallet: 'Edge'
    })
  })

  it('skips chains without a session login', async () => {
    const { wallet, signMessage } = makeWallet('solana', [
      { addressType: 'publicAddress', publicAddress: 'So1ana' }
    ])

    const query = await fetchDfxSessionQuery({ wallet, walletName: 'Edge' })

    expect(query).toBeUndefined()
    expect(fakeFetch.calls).toHaveLength(0)
    expect(signMessage).not.toHaveBeenCalled()
  })

  it('stops the launch when DFX rejects the login', async () => {
    authStatus = 403
    const { wallet } = makeWallet('bitcoin', [
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    expectLoginError(await failLogin(wallet), '/auth returned 403')
  })

  it('stops the launch when DFX blocks the country of the IP address', async () => {
    authStatus = 403
    authBody = IP_COUNTRY_BODY
    const { wallet } = makeWallet('bitcoin', [
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    const error = await fetchDfxSessionQuery({
      wallet,
      walletName: 'Edge'
    }).catch((error: unknown) => error)

    expect(error).toBeInstanceOf(RampIpCountryError)
    expect(error).toMatchObject({
      providerName: 'DFX',
      serverMessage: JSON.stringify(IP_COUNTRY_BODY)
    })
    expect(translateError(error)).toBe(
      "DFX doesn't accept connections from the country you're in. It checks where your internet connection is, not the region you chose in Edge."
    )
  })

  it('stops the launch on other country refusals too', async () => {
    authStatus = 403
    authBody = {
      statusCode: 403,
      message: 'Your country of residence is not supported',
      error: 'Forbidden'
    }
    const { wallet } = makeWallet('bitcoin', [
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    expectLoginError(
      await failLogin(wallet),
      'Your country of residence is not supported'
    )
  })

  it('refuses to sign any text but the DFX message for the address', async () => {
    signMessageText = () => 'Sign in to another service'
    const { wallet, signMessage } = makeWallet('bitcoin', [
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    expectLoginError(await failLogin(wallet), 'unexpected signMessage text')
    expect(signMessage).not.toHaveBeenCalled()
    expect(fakeFetch.calls).toHaveLength(1)
  })

  it('refuses the DFX message when it names another address', async () => {
    signMessageText = () => MESSAGE_PREFIX + 'bc1other'
    const { wallet, signMessage } = makeWallet('bitcoin', [
      { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
    ])

    expectLoginError(await failLogin(wallet), 'unexpected signMessage text')
    expect(signMessage).not.toHaveBeenCalled()
  })

  it('stops the launch when DFX does not accept the address on the chain', async () => {
    signBlockchains = ['Ethereum']
    const { wallet, signBytes } = makeWallet('base', [
      { addressType: 'publicAddress', publicAddress: '0xabc' }
    ])

    expectLoginError(await failLogin(wallet), 'address not accepted on Base')
    expect(signBytes).not.toHaveBeenCalled()
  })

  it('stops the launch when DFX does not answer in time', async () => {
    jest.useFakeTimers()
    try {
      global.fetch = (async () =>
        await new Promise<Response>(() => {})) as typeof fetch
      const { wallet, signMessage } = makeWallet('bitcoin', [
        { addressType: 'segwitAddress', publicAddress: 'bc1segwit' }
      ])

      // Caught at once, so the rejection is handled while time advances:
      const error = failLogin(wallet)
      await jest.advanceTimersByTimeAsync(10000)

      expectLoginError(await error, 'login timed out after 10000ms')
      expect(signMessage).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})
