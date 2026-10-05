import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import * as React from 'react'

import { WcSmartContractModal } from '../../components/modals/WcSmartContractModal'
import { SafeSlider } from '../../components/themed/SafeSlider'
import type { AlgoWcTransaction } from '../../util/algorandWalletConnect'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders } from '../../util/fake/FakeProviders'

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
const transactions = [
  makeTx({}),
  makeTx({ recipient: WALLET, nativeAmount: '0', rekeyTo: THIEF }),
  makeTx({ sender: DAPP, willSign: false, recipient: WALLET })
]
const payload = {
  id: 1,
  jsonrpc: '2.0',
  method: 'algo_signTxn',
  params: [[{ txn: 'pay' }, { txn: 'rekey' }, { txn: 'theirs', signers: [] }]]
}

const renderModal = (
  wallet: any,
  algoTransactions?: AlgoWcTransaction[]
): ReturnType<typeof render> =>
  render(
    <FakeProviders>
      <WcSmartContractModal
        algoTransactions={algoTransactions}
        bridge={fakeAirshipBridge}
        dApp={{ peerMeta: { name: 'Some DApp', icons: ['icon.png'] } }}
        nativeAmount="1000"
        networkFee="2000"
        payload={payload}
        requestId={7}
        tokenId={null}
        topic="topic"
        wallet={wallet}
      />
    </FakeProviders>
  )

describe('WcSmartContractModal', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('lists every Algorand transaction and warns about a rekey', () => {
    const rendered = renderModal(makeFakeWallet(), transactions)

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

  it('shows no Algorand details for other requests', () => {
    const rendered = renderModal(makeFakeWallet())

    expect(rendered.queryByText('This Request Can Take Your Funds')).toBeNull()
    expect(rendered.queryByText('Atomic Group')).toBeNull()
    rendered.unmount()
  })

  it('signs only the transactions that are ours to sign', async () => {
    const wallet = makeFakeWallet()
    const rendered = renderModal(wallet, transactions)

    await act(async () => {
      rendered.UNSAFE_getByType(SafeSlider).props.onSlidingComplete()
    })

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
