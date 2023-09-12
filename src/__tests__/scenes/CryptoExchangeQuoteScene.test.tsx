import { describe, expect, it } from '@jest/globals'
import { EdgeSwapInfo } from 'edge-core-js'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { CryptoExchangeQuoteScreenComponent } from '../../components/scenes/CryptoExchangeQuoteScene'
import { getTheme } from '../../components/services/ThemeContext'
import { GuiSwapInfo } from '../../types/types'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

const dummySwapInfo: EdgeSwapInfo = {
  pluginId: '',
  displayName: '',
  supportEmail: ''
}

describe('CryptoExchangeQuoteScreenComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeAccount: any = {
      swapConfig: {
        ChangeNow: {
          swapInfo: {
            pluginId: 'ChangeNow',
            displayName: 'ChangeNow',
            orderUri: 'ChangeNow.ChangeNow',
            supportEmail: 'ChangeNow@ChangeNow'
          }
        }
      }
    }

    const fakeRequest: any = {
      fromWallet: {
        fiatCurrencyCode: 'USD',
        name: ''
      },
      toWallet: {
        fiatCurrencyCode: 'USD',
        name: ''
      }
    }

    const swapInfo: GuiSwapInfo = {
      quote: {
        swapInfo: dummySwapInfo,
        request: fakeRequest,
        isEstimate: true,
        fromNativeAmount: '10000',
        toNativeAmount: '10000',
        networkFee: {
          currencyCode: 'BTC',
          nativeAmount: '1'
        },
        pluginId: 'ChangeNow',
        approve: async () => ({
          orderId: 'demo',
          transaction: {
            blockHeight: 500000,
            currencyCode: 'BTC',
            date: 1524486980,
            deviceDescription: 'iphone12',
            isSend: true,
            memos: [],
            metadata: {
              name: 'Crazy Person 2',
              category: 'Expense: Less Money',
              notes: 'Hell yeah! Here\'s a fish"',
              amountFiat: 36001.45
            },
            nativeAmount: '-321000000',
            networkFee: '2000',
            ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
            parentNetworkFee: '20001',
            signedTx: 'fiuwh34f98h3tiuheirgserg',
            txid: 'txid2',
            walletId: ''
          }
        }),
        close: async () => undefined
      },
      request: fakeRequest,
      fee: '1',
      fromDisplayAmount: '1',
      fromFiat: '1',
      fromTotalFiat: '1',
      toDisplayAmount: '1',
      toFiat: '1'
    }

    const actual = renderer.render(
      <CryptoExchangeQuoteScreenComponent
        {...fakeSceneProps('exchangeQuote', {
          swapInfo,
          onApprove: () => undefined
        })}
        account={fakeAccount}
        fromDenomination="BTC"
        fromWalletCurrencyName={{ fromDenomination: '' } as any}
        pending
        toDenomination="ETH"
        toWalletCurrencyName={{ fromDenomination: '' } as any}
        shift={async (swapInfo, onApprove) => {}}
        timeExpired={async (swapInfo, onApprove) => {}}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})
