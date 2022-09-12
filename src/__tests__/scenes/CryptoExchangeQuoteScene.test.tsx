/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { CryptoExchangeQuoteScreenComponent } from '../../components/scenes/CryptoExchangeQuoteScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('CryptoExchangeQuoteScreenComponent', () => {
  it('should render with loading props', () => {
    const renderer = new ShallowRenderer()
    const swapInfo = {
      quote: {
        isEstimate: true,
        fromNativeAmount: '10000',
        toNativeAmount: '10000',
        networkFee: {
          currencyCode: 'BTC',
          nativeAmount: '1'
        },
        pluginId: 'ChangeNow',
        approve: async () => [
          {
            txid: 'txid1',
            date: 1524476980,
            currencyCode: 'BTC',
            blockHeight: 500000,
            nativeAmount: '123000000',
            networkFee: '1000',
            ourReceiveAddresses: ['receiveaddress1', 'receiveaddress2'],
            signedTx: '298t983y4t983y4t93y4g98oeshfgi4t89w394t',
            parentNetworkFee: '10002',
            metadata: {
              name: 'Crazy Person',
              category: 'Income: Mo Money',
              notes: 'Hell yeah! Thanks for the fish <<&&>>',
              amountFiat: 12000.45
            },
            deviceDescription: 'iphone12'
          },
          {
            txid: 'txid2',
            date: 1524486980,
            currencyCode: 'BTC',
            blockHeight: 500000,
            nativeAmount: '-321000000',
            networkFee: '2000',
            ourReceiveAddresses: ['receiveaddress3', 'receiveaddress4'],
            signedTx: 'fiuwh34f98h3tiuheirgserg',
            parentNetworkFee: '20001',
            metadata: {
              name: 'Crazy Person 2',
              category: 'Expense: Less Money',
              notes: 'Hell yeah! Here\'s a fish"',
              amountFiat: 36001.45
            },
            deviceDescription: 'iphone12'
          }
        ],
        close: async () => undefined
      },
      request: {
        fromWallet: {
          fiatCurrencyCode: 'USD'
        },
        toWallet: {
          fiatCurrencyCode: 'USD'
        },
        fee: '1',
        fromDisplayAmount: '1',
        fromFiat: '1',
        fromTotalFiat: '1',
        toDisplayAmount: '1',
        toFiat: '1'
      }
    }
    const props = {
      route: {
        params: { swapInfo, onApprove: () => undefined }
      },
      account: {
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
      },
      fromDenomination: 'BTC',
      fromWalletCurrencyName: { fromDenomination: '' },
      pending: true,
      toDenomination: 'ETH',
      toWalletCurrencyName: { fromDenomination: '' },

      // eslint-disable-next-line flowtype/no-types-missing-file-annotation
      shift: (swapInfo, onApprove) => undefined,
      // eslint-disable-next-line flowtype/no-types-missing-file-annotation
      timeExpired: (swapInfo, onApprove) => undefined,
      theme: getTheme()
    }
    const actual = renderer.render(<CryptoExchangeQuoteScreenComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
