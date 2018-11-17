/* globals global describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { TransactionRowComponent } from '../components/common/TransactionRow.js'
import { style } from '../styles/scenes/TransactionListStyle.js'

describe('MenuDropDown component', () => {
  it('should render without props', () => {
    const renderer = new ShallowRenderer()
    const uiWallet = {
      id: 'SXq1f3x21H2e/h5A4ANvrMoK5xs+sQcDoFWHtCG25BA=',
      type: 'wallet:monero',
      name: 'Monero',
      primaryNativeBalance: '1492780012',
      nativeBalances: { XMR: '1492780012' },
      currencyNames: { XMR: 'Monero' },
      currencyCode: 'XMR',
      isoFiatCurrencyCode: 'iso:USD',
      fiatCurrencyCode: 'USD',
      denominations: [{}],
      allDenominations: { XMR: {} },
      metaTokens: [],
      enabledTokens: [],
      receiveAddress: { metadata: {}, nativeAmount: '0', publicAddress: '432hJPUp2C...' },
      blockHeight: 1688551,
      symbolImage: 'https://developer.airbitz.co/content/monero-symbol-orange-64.png',
      symbolImageDarkMono: 'https://developer.airbitz.co/content/monero-symbol-64-87939D.png',
      key: 'SXq1f3x21H2e/h5A4ANvrMoK5xs+sQcDoFWHtCG25BA='
    }
    const transaction = {
      blockHeight: 1683022,
      date: 1539555412.068,
      ourReceiveAddresses: [],
      signedTx: 'no_signature',
      txid: '4e92d23cff1714d52d48c0c5246adf4f6871d6d8d52d774b1b60cc4b28f8f296',
      amountSatoshi: -32295514330000,
      nativeAmount: '-32295514330000',
      networkFee: '0',
      currencyCode: 'XMR',
      wallet: { id: 'SXq1f3x21H…', type: 'wallet:monero' },
      otherParams: {},
      SVGMetadataElement: { name: 'ShapeShift', category: '', notes: 'Exchanged …' },
      dateString: 'Oct 14, 2018',
      time: '3:16 PM',
      key: 0
    }
    const props = {
      style,
      uiWallet,
      transactions: [{ ...transaction }],
      selectedCurrencyCode: 'XMR',
      contacts: [],
      isoFiatCurrencyCode: 'iso:USD',
      fiatCurrencyCode: 'USD',
      fiatSymbol: '$',
      requiredConfirmations: 1,
      transaction: {
        item: {
          ...transaction
        }
      },
      displayDenomination: {
        multiplier: '1000000000000',
        name: 'XMR',
        symbol: '‎ɱ'
      }
    }
    const actual = renderer.render(<TransactionRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
