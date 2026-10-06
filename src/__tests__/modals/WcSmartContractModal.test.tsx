import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import * as React from 'react'

import { WcSmartContractModal } from '../../components/modals/WcSmartContractModal'
import { SafeSlider } from '../../components/themed/SafeSlider'
import type { AlgoWcTransaction } from '../../util/algorandWalletConnect'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders } from '../../util/fake/FakeProviders'
import type {
  WcAction,
  WcDetails,
  WcWarning
} from '../../util/walletConnectActions'

const mockApproveRequest = jest.fn(
  async (topic: string, requestId: number, result: unknown) => {}
)
const mockRejectRequest = jest.fn(
  async (topic: string, requestId: number) => {}
)
jest.mock('../../hooks/useWalletConnect', () => ({
  useWalletConnect: () => ({
    approveRequest: mockApproveRequest,
    rejectRequest: mockRejectRequest
  })
}))

interface RequestProps {
  actions?: WcAction[]
  algoTransactions?: AlgoWcTransaction[]
  dAppOrigin?: string
  details?: WcDetails[]
  nativeAmount?: string
  networkFee?: string
  payload: unknown
  walletAddress?: string
  warnings?: WcWarning[]
}

const renderModal = (
  wallet: any,
  props: RequestProps
): ReturnType<typeof render> =>
  render(
    <FakeProviders>
      <WcSmartContractModal
        actions={props.actions}
        algoTransactions={props.algoTransactions}
        bridge={fakeAirshipBridge}
        dApp={{ peerMeta: { name: 'Some DApp', icons: ['icon.png'] } }}
        dAppOrigin={props.dAppOrigin}
        details={props.details}
        nativeAmount={props.nativeAmount ?? '0'}
        networkFee={props.networkFee ?? '0'}
        payload={props.payload}
        requestId={7}
        tokenId={null}
        topic="topic"
        wallet={wallet}
        walletAddress={props.walletAddress}
        warnings={props.warnings}
      />
    </FakeProviders>
  )

// Lets a promise the modal is waiting on resolve and render:
const settle = async (): Promise<void> => {
  await act(async () => {
    for (let i = 0; i < 10; ++i) await Promise.resolve()
  })
}

const approve = async (rendered: ReturnType<typeof render>): Promise<void> => {
  await act(async () => {
    rendered.UNSAFE_getByType(SafeSlider).props.onSlidingComplete()
  })
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('WcSmartContractModal with an Algorand request', () => {
  const WALLET = 'WALLETAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
  const DAPP = 'DAPPBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
  const THIEF = 'THIEFCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC'

  const makeFakeWallet = (): any => {
    const currencyInfo = {
      pluginId: 'algorand',
      currencyCode: 'ALGO',
      displayName: 'Algorand',
      denominations: [{ multiplier: '1000000', name: 'ALGO' }]
    }
    return {
      id: 'wallet-id',
      name: 'My Algorand',
      balanceMap: new Map([[null, '100000000']]),
      currencyConfig: makeFakeCurrencyConfig(currencyInfo),
      currencyInfo,
      fiatCurrencyCode: 'iso:USD',
      otherMethods: {},
      signMessage: jest.fn(async (txn: string) => `signed:${txn}`),
      watch: () => () => {}
    }
  }

  const makeTx = (fields: Partial<AlgoWcTransaction>): AlgoWcTransaction => ({
    type: 'pay',
    willSign: true,
    groupId: 'group',
    sender: WALLET,
    networkFee: '1000',
    recipient: DAPP,
    nativeAmount: '1000',
    assetId: undefined,
    clawbackFrom: undefined,
    appId: undefined,
    rekeyTo: undefined,
    closeRemainderTo: undefined,
    ...fields
  })

  // A small payment that hides a rekey, next to the dapp's own transaction:
  const algoTransactions = [
    makeTx({}),
    makeTx({ recipient: WALLET, nativeAmount: '0', rekeyTo: THIEF }),
    makeTx({ sender: DAPP, willSign: false, recipient: WALLET })
  ]
  const request = {
    nativeAmount: '1000',
    networkFee: '2000',
    payload: {
      id: 1,
      jsonrpc: '2.0',
      method: 'algo_signTxn',
      params: [
        [{ txn: 'pay' }, { txn: 'rekey' }, { txn: 'theirs', signers: [] }]
      ]
    }
  }

  it('lists every transaction and warns about a rekey', () => {
    const rendered = renderModal(makeFakeWallet(), {
      ...request,
      algoTransactions
    })

    rendered.getByText('Smart Contract Call')
    rendered.getByText('This Request Can Take Your Funds')
    rendered.getByText(
      'Transaction 2 gives THIEFC...CCCCCC permanent control of this account and everything in it'
    )
    rendered.getByText('Atomic Group')
    rendered.getByText('These 3 transactions succeed or fail together')
    rendered.getByText('1. Payment')
    rendered.getByText('0.001 ALGO to DAPPBB...BBBBBB')
    rendered.getByText('2. Payment')
    rendered.getByText('3. Payment (signed by someone else)')
    rendered.getByText('0.001 ALGO from DAPPBB...BBBBBB to this wallet')
    rendered.unmount()
  })

  it('shows no transaction list when the plugin sends none', () => {
    const rendered = renderModal(makeFakeWallet(), request)

    expect(rendered.queryByText('This Request Can Take Your Funds')).toBeNull()
    expect(rendered.queryByText('Atomic Group')).toBeNull()
    expect(rendered.queryByText('Check This Request Carefully')).toBeNull()
    rendered.unmount()
  })

  it('signs only the transactions that are ours to sign', async () => {
    const wallet = makeFakeWallet()
    const rendered = renderModal(wallet, { ...request, algoTransactions })
    await approve(rendered)

    expect(wallet.signMessage.mock.calls).toEqual([['pay'], ['rekey']])
    expect(mockApproveRequest).toHaveBeenCalledWith('topic', 7, [
      'signed:pay',
      'signed:rekey',
      null
    ])
    expect(mockRejectRequest).not.toHaveBeenCalled()
    rendered.unmount()
  })
})

describe('WcSmartContractModal with an EVM request', () => {
  const WALLET = '0xCb563b7B20eaD56c1Be5AA733164D34D4617EAB7'
  const SPENDER = '0xDe709F2102306220921060314715629080e2fB77'
  const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  const USDC_TOKEN_ID = 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

  const makeFakeWallet = (): any => {
    const currencyInfo = {
      pluginId: 'ethereum',
      currencyCode: 'ETH',
      displayName: 'Ethereum',
      denominations: [{ multiplier: '1000000000000000000', name: 'ETH' }]
    }
    return {
      id: 'wallet-id',
      name: 'My Ether',
      balanceMap: new Map([[null, '1000000000000000000']]),
      currencyConfig: makeFakeCurrencyConfig(currencyInfo, {
        [USDC_TOKEN_ID]: {
          currencyCode: 'USDC',
          denominations: [{ multiplier: '1000000', name: 'USDC' }],
          displayName: 'USD Coin',
          networkLocation: { contractAddress: USDC }
        }
      }),
      currencyInfo,
      fiatCurrencyCode: 'iso:USD',
      otherMethods: {},
      signMessage: jest.fn(async (message: string) => `signed:${message}`),
      watch: () => () => {}
    }
  }

  it('shows an unlimited permit for what it is', () => {
    const rendered = renderModal(makeFakeWallet(), {
      payload: { method: 'eth_signTypedData_v4', params: [WALLET, '{}'] },
      walletAddress: WALLET,
      actions: [
        {
          type: 'approve',
          contractAddress: USDC,
          tokenId: USDC_TOKEN_ID,
          owner: WALLET,
          spender: SPENDER,
          nativeAmount:
            '115792089237316195423570985008687907853269984665640564039457584007913129639935',
          unlimited: true,
          expiration: undefined,
          oneTime: false
        }
      ],
      details: [
        { title: 'Domain', rows: [{ name: 'name', value: 'USD Coin' }] },
        { title: 'Permit', rows: [{ name: 'spender', value: SPENDER }] }
      ]
    })

    rendered.getByText('Signature Request')
    expect(rendered.queryByText('Smart Contract Call')).toBeNull()
    rendered.getByText('Check This Request Carefully')
    rendered.getByText(
      'This lets 0xDe70...e2fB77 spend all of your USDC, now and in the future'
    )
    rendered.getByText('Token Approval')
    rendered.getByText(
      'Allow 0xDe70...e2fB77 to spend unlimited USDC\nDoes not expire'
    )
    // A signature that grants an allowance keeps the full warning:
    rendered.getByText(
      'Approving this request may move funds or grant permissions'
    )
    // The details list every signed field in full:
    rendered.getByText('Permit')
    rendered.getByText('spender')
    rendered.getByText(SPENDER)
    rendered.unmount()
  })

  it('shows what a transaction asks for', () => {
    const rendered = renderModal(makeFakeWallet(), {
      nativeAmount: '250000000000000000',
      networkFee: '1000000000000000',
      payload: {
        method: 'eth_sendTransaction',
        params: [{ from: WALLET, to: USDC, data: '0x' }]
      },
      walletAddress: WALLET,
      actions: [
        {
          type: 'contractCall',
          contractAddress: USDC,
          selector: '0x5ae401dc',
          functionName: undefined,
          nativeAmount: '250000000000000000'
        },
        {
          type: 'approveAll',
          contractAddress: USDC,
          operator: SPENDER,
          approved: true
        }
      ]
    })

    rendered.getByText('Smart Contract Call')
    rendered.getByText('Contract Call')
    rendered.getByText('0x5ae401dc on 0xA0b8...06eB48\nSends 0.25 ETH')
    rendered.getByText('NFT Collection Approval')
    rendered.getByText(
      'This lets 0xDe70...e2fB77 take every NFT you hold in collection 0xA0b8...06eB48'
    )
    rendered.unmount()
  })

  it('shows what a described call does, value by value', () => {
    const rendered = renderModal(makeFakeWallet(), {
      networkFee: '1000000000000000',
      payload: {
        method: 'eth_sendTransaction',
        params: [{ from: WALLET, to: SPENDER, data: '0x04e45aaf' }]
      },
      walletAddress: WALLET,
      actions: [
        {
          type: 'intent',
          intent: 'swap',
          summary: undefined,
          fields: [
            {
              label: 'Amount to Send',
              value: '1000 USDC',
              address: undefined,
              tokenAddress: undefined
            },
            {
              label: 'Beneficiary',
              value: WALLET,
              address: WALLET,
              tokenAddress: undefined
            }
          ],
          contractAddress: SPENDER,
          contractName: 'Uniswap v3 Router 2',
          owner: 'Uniswap Labs',
          nativeAmount: '0'
        }
      ]
    })

    rendered.getByText('Swap')
    rendered.getByText('Uniswap v3 Router 2 by Uniswap Labs')
    rendered.getByText('Amount to Send')
    rendered.getByText('1000 USDC')
    rendered.getByText('Beneficiary')
    rendered.getByText('this wallet')
    expect(rendered.queryByText('Check This Request Carefully')).toBeNull()
    rendered.unmount()
  })

  describe('with a plugin that can simulate', () => {
    const request = {
      nativeAmount: '100000000000000000',
      networkFee: '1000000000000000',
      payload: {
        method: 'eth_sendTransaction',
        params: [{ from: WALLET, to: SPENDER, data: '0x04e45aaf' }]
      },
      walletAddress: WALLET
    }
    const makeSimulatingWallet = (simulate: () => Promise<unknown>): any => {
      const wallet = makeFakeWallet()
      wallet.otherMethods = {
        simulateWalletConnectV2Payload: jest.fn(simulate)
      }
      return wallet
    }

    it('shows what a swap would send and receive', async () => {
      const wallet = makeSimulatingWallet(async () => ({
        success: true,
        assetChanges: [
          { nativeAmount: '-100000000000000000' },
          {
            contractAddress: USDC,
            tokenId: USDC_TOKEN_ID,
            nativeAmount: '270698529'
          },
          {
            contractAddress: SPENDER,
            symbol: 'SHIB',
            decimals: 18,
            nativeAmount: '45845964669569975277825777'
          }
        ],
        approvals: [
          {
            type: 'approve',
            contractAddress: USDC,
            tokenId: USDC_TOKEN_ID,
            owner: WALLET,
            spender: SPENDER,
            nativeAmount: '5000000',
            unlimited: false
          }
        ]
      }))
      const rendered = renderModal(wallet, request)

      // The request shows right away, and the result fills in:
      rendered.getByText('Expected Result')
      await settle()
      rendered.getByText('This transaction is expected to succeed')
      expect(
        wallet.otherMethods.simulateWalletConnectV2Payload
      ).toHaveBeenCalledWith(request.payload)
      rendered.getByText('You Send')
      rendered.getByText('0.1 ETH')
      expect(rendered.getAllByText('You Receive').length).toBe(2)
      rendered.getByText('270.698529 USDC')
      rendered.getByText(
        '45,845,964.669569975277825777 SHIB (token 0xDe70...e2fB77)'
      )
      rendered.getByText(
        'Allow 0xDe70...e2fB77 to spend 5 USDC\nDoes not expire'
      )
      rendered.unmount()
    })

    it('warns when the transaction would fail', async () => {
      const wallet = makeSimulatingWallet(async () => ({
        success: false,
        error: 'STF'
      }))
      const rendered = renderModal(wallet, request)

      await settle()
      rendered.getByText('This Transaction Is Expected to Fail')
      rendered.getByText('STF')
      rendered.unmount()
    })

    it('shows an approval once when the simulation repeats it', async () => {
      const approval = {
        type: 'approve' as const,
        contractAddress: USDC,
        tokenId: USDC_TOKEN_ID,
        spender: SPENDER,
        nativeAmount: '5000000',
        unlimited: false
      }
      const wallet = makeSimulatingWallet(async () => ({
        success: true,
        assetChanges: [],
        approvals: [approval]
      }))
      const rendered = renderModal(wallet, {
        ...request,
        actions: [
          { ...approval, owner: WALLET, expiration: undefined, oneTime: false }
        ]
      })

      await settle()
      expect(rendered.getAllByText('Token Approval').length).toBe(1)
      rendered.getByText(
        'This transaction is expected to succeed without changing your balances'
      )
      rendered.unmount()
    })

    it('alerts on an allowance only the simulation finds', async () => {
      const wallet = makeSimulatingWallet(async () => ({
        success: true,
        assetChanges: [],
        approvals: [
          {
            type: 'approve',
            contractAddress: USDC,
            tokenId: USDC_TOKEN_ID,
            spender: SPENDER,
            nativeAmount: '1' + '0'.repeat(40),
            unlimited: true
          }
        ]
      }))
      const rendered = renderModal(wallet, request)

      await settle()
      rendered.getByText(
        'This lets 0xDe70...e2fB77 spend all of your USDC, now and in the future'
      )
      rendered.unmount()
    })

    it('says when the network cannot report balance changes', async () => {
      const wallet = makeSimulatingWallet(async () => ({ success: true }))
      const rendered = renderModal(wallet, request)

      await settle()
      rendered.getByText(
        'This transaction is expected to succeed. This network cannot show how it changes your balances'
      )
      rendered.unmount()
    })

    it('says when the simulation is not available', async () => {
      const wallet = makeSimulatingWallet(async () => {
        throw new Error('All servers failed')
      })
      const rendered = renderModal(wallet, request)

      await settle()
      rendered.getByText('Could not simulate this transaction')
      rendered.unmount()
    })

    it('does not simulate a signature request', () => {
      const wallet = makeSimulatingWallet(async () => ({ success: true }))
      const rendered = renderModal(wallet, {
        payload: { method: 'personal_sign', params: ['0x4869', WALLET] },
        actions: [{ type: 'signText', text: 'Hi' }]
      })

      expect(rendered.queryByText('Expected Result')).toBeNull()
      expect(
        wallet.otherMethods.simulateWalletConnectV2Payload
      ).not.toHaveBeenCalled()
      rendered.unmount()
    })
  })

  it('warns when a sign-in is for another site', () => {
    const signIn: WcAction = {
      type: 'signIn',
      domain: 'opensea.io',
      address: WALLET,
      statement: 'Welcome back',
      uri: 'https://opensea.io',
      chainId: '1',
      expirationTime: undefined
    }
    const payload = { method: 'personal_sign', params: ['0x00', WALLET] }

    const phishing = renderModal(makeFakeWallet(), {
      payload,
      actions: [signIn],
      dAppOrigin: 'https://free-nfts.example'
    })
    phishing.getByText('Sign in to opensea.io\nWelcome back')
    phishing.getByText(
      'This sign-in is for opensea.io, but the request came from free-nfts.example'
    )
    phishing.unmount()

    const honest = renderModal(makeFakeWallet(), {
      payload,
      actions: [signIn],
      dAppOrigin: 'https://opensea.io/collection'
    })
    honest.getByText('Sign in to opensea.io\nWelcome back')
    expect(honest.queryByText('Check This Request Carefully')).toBeNull()
    honest.unmount()
  })

  it('shows the plugin warnings', () => {
    const rendered = renderModal(makeFakeWallet(), {
      payload: { method: 'personal_sign', params: ['0xfffe', WALLET] },
      actions: [{ type: 'signBytes', hex: '0xfffe', byteLength: 2 }],
      warnings: [{ code: 'unreadable' }, { code: 'truncated' }]
    })

    rendered.getByText('Data')
    rendered.getByText('0xfffe\n2 bytes')
    rendered.getByText(
      'Edge cannot read this data. Signing it could approve something you cannot see'
    )
    rendered.getByText('This request is too large to show in full')
    rendered.unmount()
  })

  it('tells a signer what a plain signature can and cannot do', () => {
    const rendered = renderModal(makeFakeWallet(), {
      payload: { method: 'personal_sign', params: ['0x4869', WALLET] },
      actions: [{ type: 'signText', text: 'Hi' }]
    })
    rendered.getByText(
      'Signing proves you control this address. It moves no funds, but only approve it for an application you trust.'
    )
    expect(
      rendered.queryByText(
        'Approving this request may move funds or grant permissions'
      )
    ).toBeNull()
    rendered.unmount()

    // Data nobody can read keeps the full warning:
    const unreadable = renderModal(makeFakeWallet(), {
      payload: { method: 'personal_sign', params: ['0xfffe', WALLET] },
      actions: [{ type: 'signBytes', hex: '0xfffe', byteLength: 2 }],
      warnings: [{ code: 'unreadable' }]
    })
    unreadable.getByText(
      'Approving this request may move funds or grant permissions'
    )
    unreadable.unmount()
  })

  it('signs the message a personal_sign request shows', async () => {
    const wallet = makeFakeWallet()
    const rendered = renderModal(wallet, {
      payload: { method: 'personal_sign', params: ['0x4869', WALLET] },
      actions: [{ type: 'signText', text: 'Hi' }]
    })
    rendered.getByText('Message')
    rendered.getByText('Hi')
    await approve(rendered)

    expect(wallet.signMessage.mock.calls).toEqual([['0x4869']])
    expect(mockApproveRequest).toHaveBeenCalledWith('topic', 7, 'signed:0x4869')
    rendered.unmount()
  })
})
