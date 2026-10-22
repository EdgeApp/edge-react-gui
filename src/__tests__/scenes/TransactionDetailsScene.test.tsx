import { afterEach, describe, expect, it, jest } from '@jest/globals'
import {
  fireEvent,
  render,
  type RenderResult
} from '@testing-library/react-native'
import type { EdgeAssetActionType, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import Mailer from 'react-native-mail'

import { TransactionDetailsScene } from '../../components/scenes/TransactionDetailsScene'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

jest.mock('react-native-mail', () => ({ mail: jest.fn() }))

const RECIPIENT_ADDRESS = 'bc1qrecipientaddressthepayeecontrols'
const DEPOSIT_ADDRESS = '13e6qqcAZCgApTDyMNG8brru4PmtjbReUd'

const fakeCurrencyConfig = makeFakeCurrencyConfig(btcCurrencyInfo)

const fakeCoreWallet: any = {
  balanceMap: new Map([[null, '123123']]),
  blockHeight: 12345,
  currencyConfig: fakeCurrencyConfig,
  currencyInfo: fakeCurrencyConfig.currencyInfo,
  enabledTokenIds: [],
  fiatCurrencyCode: 'iso:USD',
  id: '123',
  name: 'wallet name',
  type: 'wallet:bitcoin',
  watch() {}
}

describe('TransactionDetailsScene', () => {
  const fakeState: FakeState = {
    core: {
      account: {
        currencyWallets: { '123': fakeCoreWallet },
        currencyConfig: { bitcoin: fakeCurrencyConfig },
        watch() {}
      }
    },
    contacts: [
      {
        givenName: 'Timmy',
        thumbnailPath: 'thumb/nail/path'
      }
    ],
    exchangeRates: {
      crypto: {
        bitcoin: {
          '': {
            'iso:USD': {
              current: 10000
            }
          }
        }
      },
      fiat: {
        'iso:USD': { 'iso:USD': { current: 10000 } }
      }
    }
  }

  it('should render', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TransactionDetailsScene
          {...fakeEdgeAppSceneProps('transactionDetails', {
            edgeTransaction: {
              blockHeight: 0,
              currencyCode: 'BTC',
              date: 1535752780.947, // 2018-08-31T21:59:40.947Z
              isSend: false,
              memos: [],
              metadata: { name: 'timmy' },
              nativeAmount: '12300000',
              networkFee: '1',
              networkFees: [],
              otherParams: {},
              ourReceiveAddresses: ['this is an address'],
              signedTx: 'this is a signed tx',
              tokenId: null,
              txid: 'this is the txid',
              walletId: fakeCoreWallet.id
            },
            walletId: fakeCoreWallet.id
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render with negative nativeAmount and fiatAmount', () => {
    const rendered = render(
      <FakeProviders initialState={fakeState}>
        <TransactionDetailsScene
          {...fakeEdgeAppSceneProps('transactionDetails', {
            edgeTransaction: {
              blockHeight: 0,
              currencyCode: 'BTC',
              date: 1535752780.947, // 2018-08-31T21:59:40.947Z
              isSend: true,
              memos: [],
              metadata: {
                exchangeAmount: { 'iso:USD': -6392.93 },
                name: 'timmy'
              },
              nativeAmount: '-12300000',
              networkFee: '1',
              networkFees: [],
              otherParams: {},
              ourReceiveAddresses: ['this is an address'],
              signedTx: 'this is a signed tx',
              tokenId: null,
              txid: 'this is the txid',
              walletId: fakeCoreWallet.id
            },
            walletId: fakeCoreWallet.id
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  describe('swapSend', () => {
    interface SwapSendOpts {
      assetActionType?: EdgeAssetActionType
      privacy?: boolean
    }

    /**
     * A broadcast send, as the swap plugin leaves it: the spend target is the
     * provider's deposit address, and the payee rides on the saved action
     * alone.
     */
    const makeSwapSendTx = (opts: SwapSendOpts = {}): EdgeTransaction => {
      const { assetActionType = 'swap', privacy = false } = opts

      return {
        assetAction: { assetActionType },
        blockHeight: 0,
        currencyCode: 'BTC',
        date: 1535752780.947, // 2018-08-31T21:59:40.947Z
        isSend: true,
        memos: [],
        nativeAmount: '-38693',
        networkFee: '1',
        networkFees: [],
        ourReceiveAddresses: [],
        savedAction: {
          actionType: 'swapSend',
          swapInfo: {
            pluginId: 'houdini',
            displayName: 'HoudiniSwap',
            supportEmail: 'support@example.com'
          },
          orderId: '9zdiWHWi2Q4Y7NRPB8k7mL',
          isEstimate: true,
          fromAsset: {
            pluginId: 'bitcoin',
            tokenId: null,
            nativeAmount: '38693'
          },
          toAsset: {
            pluginId: 'bitcoin',
            tokenId: null,
            nativeAmount: '37580'
          },
          payoutAddress: RECIPIENT_ADDRESS,
          privacy
        },
        signedTx: 'this is a signed tx',
        spendTargets: [
          {
            currencyCode: 'BTC',
            memo: undefined,
            nativeAmount: '38693',
            publicAddress: DEPOSIT_ADDRESS,
            uniqueIdentifier: undefined
          }
        ],
        tokenId: null,
        txid: 'this is the txid',
        walletId: fakeCoreWallet.id
      }
    }

    const renderScene = (edgeTransaction: EdgeTransaction): RenderResult =>
      render(
        <FakeProviders initialState={fakeState}>
          <TransactionDetailsScene
            {...fakeEdgeAppSceneProps('transactionDetails', {
              edgeTransaction,
              walletId: fakeCoreWallet.id
            })}
          />
        </FakeProviders>
      )

    afterEach(() => {
      jest.restoreAllMocks()
      jest.clearAllMocks()
    })

    it.each([
      ['private', true],
      ['transparent', false]
    ])('shows the recipient address on a %s send', (_flavor, privacy) => {
      const rendered = renderScene(makeSwapSendTx({ privacy }))

      rendered.getByText(lstrings.transaction_details_recipient_address)
      rendered.getByText(RECIPIENT_ADDRESS)
      rendered.getByText(lstrings.transaction_details_exchange_deposit_address)
      rendered.getByText(DEPOSIT_ADDRESS)

      // The recipient sits directly above the provider's deposit address:
      const tree = JSON.stringify(rendered.toJSON())
      expect(tree.indexOf(RECIPIENT_ADDRESS)).toBeLessThan(
        tree.indexOf(DEPOSIT_ADDRESS)
      )
      rendered.unmount()
    })

    it('names no recipient on the parent network-fee row', () => {
      const rendered = renderScene(
        makeSwapSendTx({ assetActionType: 'swapNetworkFee', privacy: true })
      )

      expect(
        rendered.queryByText(lstrings.transaction_details_recipient_address)
      ).toBeNull()
      expect(rendered.queryByText(RECIPIENT_ADDRESS)).toBeNull()
      rendered.unmount()
    })

    it('adds no recipient row to an ordinary send', () => {
      const { assetAction, savedAction, ...ordinarySend } = makeSwapSendTx()
      const rendered = renderScene(ordinarySend)

      expect(
        rendered.queryByText(lstrings.transaction_details_recipient_address)
      ).toBeNull()
      rendered.getByText(lstrings.transaction_details_recipient_addresses)
      rendered.unmount()
    })

    it('prints the payout address in a private send exchange details', () => {
      const showModal = jest.spyOn(Airship, 'show').mockResolvedValue(undefined)
      const rendered = renderScene(makeSwapSendTx({ privacy: true }))

      fireEvent.press(rendered.getByTestId('exchangeDetailsRow'))

      const [renderModal] = showModal.mock.calls[0]
      const modal = renderModal(fakeAirshipBridge)
      if (!React.isValidElement<{ body: string }>(modal)) {
        throw new Error('Expected the exchange details modal')
      }
      expect(modal.props.body).toContain(
        `${lstrings.transaction_details_exchange_payout_address}:\n${RECIPIENT_ADDRESS}\n`
      )
      rendered.unmount()
    })

    it('prints the payout address in a private send support email', () => {
      const rendered = renderScene(makeSwapSendTx({ privacy: true }))

      fireEvent.press(rendered.getByTestId('exchangeSupportRow'))

      const [email] = jest.mocked(Mailer.mail).mock.calls[0]
      expect(email.body).toContain(
        `${lstrings.transaction_details_exchange_payout_address}:<br />${RECIPIENT_ADDRESS}<br />`
      )
      rendered.unmount()
    })
  })
})
