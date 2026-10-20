import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import * as React from 'react'

import { WalletConnectService } from '../../components/services/WalletConnectService'
import { walletConnectClient } from '../../hooks/useWalletConnect'
import { FakeProviders } from '../../util/fake/FakeProviders'

const TOPIC = 'topic'
const WALLET_ID = 'wallet-id'
const ADDRESS = '0xCb563b7B20eaD56c1Be5AA733164D34D4617EAB7'

// The service imports this for its polyfills, which the test does not need:
jest.mock('@walletconnect/react-native-compat', () => ({}))

// The remembered session-to-wallet map, normally in the account's data store:
let mockSessionWallets: Record<string, string> = {}
jest.mock('../../util/walletConnectSessionStore', () => ({
  readActiveSessionWallets: async () => mockSessionWallets,
  rememberSessionWallet: async () => {},
  forgetSessionWallet: async () => {}
}))

// The WalletConnect client, as far as the service uses it:
let handlers: Record<string, (event: unknown) => void> = {}
const mockExtendSession = jest.fn(async (params: { topic: string }) => {})
const mockRespondSessionRequest = jest.fn(async (params: unknown) => {})
let sessions: Record<string, unknown> = {}
const fakeClient = {
  events: { listenerCount: () => 0, removeListener: () => {} },
  on: (event: string, handler: (event: unknown) => void) => {
    handlers[event] = handler
  },
  getActiveSessions: () => sessions,
  extendSession: mockExtendSession,
  respondSessionRequest: mockRespondSessionRequest
}

const makeSession = (): unknown => ({
  topic: TOPIC,
  expiry: 1_700_000_000,
  peer: {
    metadata: {
      name: 'Some DApp',
      url: 'https://dapp.example',
      icons: ['icon.png']
    }
  },
  namespaces: {
    eip155: {
      accounts: [`eip155:1:${ADDRESS}`],
      chains: ['eip155:1'],
      methods: ['personal_sign'],
      events: []
    }
  }
})

const makeWallet = (): any => ({
  id: WALLET_ID,
  name: 'My Ether',
  currencyInfo: {
    pluginId: 'ethereum',
    currencyCode: 'ETH',
    displayName: 'Ethereum',
    denominations: [{ multiplier: '1000000000000000000', name: 'ETH' }]
  },
  getAddresses: async () => [
    { publicAddress: ADDRESS, addressType: 'publicAddress' }
  ],
  otherMethods: {
    // A plugin that refuses every request, so no modal opens:
    parseWalletConnectV2Payload: async () => {
      throw new Error('Not today')
    }
  },
  watch: () => () => {}
})

const makeAccount = (wallets: Record<string, unknown>): any => ({
  currencyWallets: wallets,
  watch: () => () => {}
})

const makeRequest = (): unknown => ({
  id: 7,
  topic: TOPIC,
  params: {
    request: { method: 'personal_sign', params: ['0x4869', ADDRESS] },
    chainId: 'eip155:1'
  },
  verifyContext: { verified: { origin: 'https://dapp.example' } }
})

// Lets the promise chains the service runs settle:
const settle = async (): Promise<void> => {
  await act(async () => {
    for (let i = 0; i < 20; ++i) await Promise.resolve()
  })
}

const renderService = async (
  account: unknown
): Promise<ReturnType<typeof render>> => {
  const rendered = render(
    <FakeProviders initialState={{ core: { account } } as any}>
      <WalletConnectService account={account as any} />
    </FakeProviders>
  )
  // The service attaches its request listener once its effect runs:
  await settle()
  expect(handlers.session_request).toBeDefined()
  return rendered
}

const sendRequest = async (): Promise<void> => {
  handlers.session_request(makeRequest())
  await settle()
}

beforeEach(() => {
  walletConnectClient.client = fakeClient as any
  sessions = { [TOPIC]: makeSession() }
  mockSessionWallets = { [TOPIC]: WALLET_ID }
})

afterEach(() => {
  walletConnectClient.client = undefined
  handlers = {}
  jest.clearAllMocks()
})

describe('WalletConnectService', () => {
  it('extends the session a request arrives on', async () => {
    const rendered = await renderService(
      makeAccount({ [WALLET_ID]: makeWallet() })
    )
    await sendRequest()

    expect(mockExtendSession).toHaveBeenCalledWith({ topic: TOPIC })
    // The extension does not depend on how the request itself goes:
    expect(mockRespondSessionRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: TOPIC,
        response: expect.objectContaining({ id: 7, error: expect.anything() })
      })
    )
    rendered.unmount()
  })

  it('leaves a session alone when no wallet can serve it', async () => {
    mockSessionWallets = {}
    const rendered = await renderService(makeAccount({}))
    await sendRequest()

    expect(mockExtendSession).not.toHaveBeenCalled()
    expect(mockRespondSessionRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: TOPIC,
        response: expect.objectContaining({ id: 7, error: expect.anything() })
      })
    )
    rendered.unmount()
  })

  it('ignores a request for a session it does not have', async () => {
    sessions = {}
    const rendered = await renderService(
      makeAccount({ [WALLET_ID]: makeWallet() })
    )
    await sendRequest()

    expect(mockExtendSession).not.toHaveBeenCalled()
    expect(mockRespondSessionRequest).not.toHaveBeenCalled()
    rendered.unmount()
  })
})
