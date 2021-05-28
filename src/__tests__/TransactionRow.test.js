/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import { bns } from 'biggystring'
import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../components/services/ThemeContext.js'
import { TransactionListRowComponent } from '../components/themed/TransactionListRow.js'
import { imageServerUrl } from '../constants/WalletAndCurrencyConstants.js'
import * as intl from '../locales/intl.js'
import * as UTILS from '../util/utils'

describe('Transaction List Row', () => {
  it('should render props', () => {
    const renderer = new ShallowRenderer()
    const guiWallet = {
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
      receiveAddress: {
        metadata: {},
        nativeAmount: '0',
        publicAddress: '432hJPUp2C...'
      },
      blockHeight: 1688551,
      symbolImage: `${imageServerUrl}/monero-symbol-orange-64.png`,
      symbolImageDarkMono: `${imageServerUrl}/monero-symbol-64-87939D.png`,
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
      SVGMetadataElement: {
        name: 'ShapeShift',
        category: '',
        notes: 'Exchanged …'
      },
      dateString: 'Oct 14, 2018',
      time: '3:16 PM',
      key: 0,
      metadata: {
        amountFiat: 4424808418353299.5
      }
    }
    const displayDenomination = {
      multiplier: '1000000000000',
      name: 'XMR',
      symbol: '‎ɱ'
    }
    // CryptoAmount
    const cryptoAmount = UTILS.convertNativeToDisplay(
      displayDenomination.multiplier
    )(bns.abs(transaction.nativeAmount || ''))
    const cryptoAmountFormat = intl.formatNumber(
      UTILS.decimalOrZero(UTILS.truncateDecimals(cryptoAmount, 6), 6)
    )
    // FiatAmount
    const fiatAmount = bns.abs(transaction.metadata.amountFiat.toFixed(2))
    const fiatAmountFormat = intl.formatNumber(bns.toFixed(fiatAmount, 2, 2), {
      toFixed: 2
    })
    const props = {
      cryptoAmount: cryptoAmountFormat,
      denominationSymbol: displayDenomination.symbol,
      fiatAmount: fiatAmountFormat,
      fiatSymbol: UTILS.getFiatSymbol(guiWallet.fiatCurrencyCode),
      isSentTransaction: UTILS.isSentTransaction(transaction),
      requiredConfirmations: 15,
      selectedCurrencyName: guiWallet.currencyNames[guiWallet.currencyCode],
      thumbnailPath: '',
      walletBlockHeight: guiWallet.blockHeight,
      transaction: transaction,
      theme: getTheme()
    }
    const actual = renderer.render(<TransactionListRowComponent {...props} />)

    expect(actual).toMatchSnapshot()
  })
})
