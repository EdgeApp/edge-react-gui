// @flow
/* globals describe it expect */

import { abs, toFixed } from 'biggystring'
import { type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext.js'
import { TransactionListRowComponent } from '../../components/themed/TransactionListRow.js'
import { getSymbolFromCurrency } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../../locales/intl.js'
import { type GuiWallet } from '../../types/types.js'
import { convertNativeToDisplay, decimalOrZero, isSentTransaction, truncateDecimals } from '../../util/utils'

describe('Transaction List Row', () => {
  it('should render props', () => {
    const renderer = new ShallowRenderer()
    const guiWallet: GuiWallet = {
      id: 'SXq1f3x21H2e/h5A4ANvrMoK5xs+sQcDoFWHtCG25BA=',
      type: 'wallet:monero',
      name: 'Monero',
      pluginId: 'monero',
      primaryNativeBalance: '1492780012',
      nativeBalances: { XMR: '1492780012' },
      currencyNames: { XMR: 'Monero' },
      currencyCode: 'XMR',
      isoFiatCurrencyCode: 'iso:USD',
      fiatCurrencyCode: 'USD',
      metaTokens: [],
      enabledTokens: [],
      blockHeight: 1688551
    }
    const amountFiat = 4424808418353299.5

    const wallet: any = { id: 'SXq1f3x21H…', type: 'wallet:monero' }
    const transaction: EdgeTransaction = {
      blockHeight: 1683022,
      date: 1539555412.068,
      ourReceiveAddresses: [],
      signedTx: 'no_signature',
      txid: '4e92d23cff1714d52d48c0c5246adf4f6871d6d8d52d774b1b60cc4b28f8f296',
      amountSatoshi: -32295514330000,
      nativeAmount: '-32295514330000',
      networkFee: '0',
      currencyCode: 'XMR',
      wallet,
      otherParams: {},
      SVGMetadataElement: { name: 'ShapeShift', category: '', notes: 'Exchanged …' },
      dateString: 'Oct 14, 2018',
      time: '3:16 PM',
      key: 0,
      metadata: { amountFiat }
    }
    const displayDenomination = {
      multiplier: '1000000000000',
      name: 'XMR',
      symbol: '‎ɱ'
    }
    // CryptoAmount
    const cryptoAmount = convertNativeToDisplay(displayDenomination.multiplier)(abs(transaction.nativeAmount ?? ''))
    const cryptoAmountFormat = formatNumber(decimalOrZero(truncateDecimals(cryptoAmount), 6))
    // FiatAmount
    const fiatAmount = abs(amountFiat.toFixed(2))
    const fiatAmountFormat = formatNumber(toFixed(fiatAmount, 2, 2), { toFixed: 2 })
    const props: any = {
      cryptoAmount: cryptoAmountFormat,
      denominationSymbol: displayDenomination.symbol,
      fiatAmount: fiatAmountFormat,
      fiatSymbol: getSymbolFromCurrency(guiWallet.fiatCurrencyCode),
      isSentTransaction: isSentTransaction(transaction),
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
