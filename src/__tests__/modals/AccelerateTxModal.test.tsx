import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import type {
  EdgeCurrencyInfo,
  EdgeDenomination,
  EdgeTokenId,
  EdgeTokenMap,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'

import { AccelerateTxModalComponent } from '../../components/modals/AccelerateTxModal'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakeCurrencyConfig } from '../../util/fake/fakeCurrencyConfig'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders } from '../../util/fake/FakeProviders'

type TxSpendTarget = NonNullable<EdgeTransaction['spendTargets']>[number]

const usdcTokens: EdgeTokenMap = {
  usdc: {
    currencyCode: 'USDC',
    displayName: 'USD Coin',
    denominations: [{ multiplier: '1000000', name: 'USDC' }],
    networkLocation: undefined
  }
}

function makeTx(
  currencyCode: string,
  tokenId: EdgeTokenId,
  nativeAmount: string,
  networkFee: string,
  spendTargets?: TxSpendTarget[]
): EdgeTransaction {
  return {
    blockHeight: 0,
    currencyCode,
    date: 0,
    isSend: true,
    memos: [],
    nativeAmount,
    networkFee,
    networkFees: [],
    otherParams: {},
    ourReceiveAddresses: ['123123123'],
    signedTx: '',
    spendTargets,
    tokenId,
    txid: '',
    walletId: ''
  }
}

function makeTarget(
  currencyCode: string,
  nativeAmount: string,
  publicAddress: string
): TxSpendTarget {
  return {
    currencyCode,
    nativeAmount,
    publicAddress,
    memo: undefined,
    uniqueIdentifier: undefined
  }
}

function renderModal(opts: {
  currencyInfo: EdgeCurrencyInfo
  tokens?: EdgeTokenMap
  replacedTx: EdgeTransaction
  acceleratedTx: EdgeTransaction
  amountDisplayDenomination: EdgeDenomination
  feeDisplayDenomination: EdgeDenomination
}): ReturnType<typeof render> {
  const fakeWallet: any = {
    fiatCurrencyCode: 'iso:USD',
    currencyInfo: opts.currencyInfo,
    currencyConfig: makeFakeCurrencyConfig(opts.currencyInfo, opts.tokens)
  }

  return render(
    <FakeProviders>
      <AccelerateTxModalComponent
        bridge={fakeAirshipBridge}
        isoFiatCurrencyCode="iso:USD"
        replacedTx={opts.replacedTx}
        acceleratedTx={opts.acceleratedTx}
        wallet={fakeWallet}
        exchangeRates={{ crypto: {}, fiat: {} }}
        amountDisplayDenomination={opts.amountDisplayDenomination}
        feeDisplayDenomination={opts.feeDisplayDenomination}
        theme={getTheme()}
      />
    </FakeProviders>
  )
}

const mbtc: EdgeDenomination = { multiplier: '100000', name: 'mBTC' }
const legacyFixtureDenom: EdgeDenomination = {
  multiplier: '1000000',
  name: 'BTC'
}

describe('AccelerateTxModalComponent', () => {
  it('should render with loading props', () => {
    const rendered = renderModal({
      currencyInfo: btcCurrencyInfo,
      replacedTx: makeTx('BTC', null, '-681', '681'),
      acceleratedTx: makeTx('BTC', null, '-95362', '1362', [
        makeTarget('BTC', '94000', 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu')
      ]),
      amountDisplayDenomination: legacyFixtureDenom,
      feeDisplayDenomination: legacyFixtureDenom
    })

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('shows each recipient with its own amount', () => {
    const rendered = renderModal({
      currencyInfo: btcCurrencyInfo,
      replacedTx: makeTx('BTC', null, '-150681', '681'),
      acceleratedTx: makeTx('BTC', null, '-151362', '1362', [
        makeTarget('BTC', '100000', 'bc1qfirstrecipient'),
        makeTarget('BTC', '50000', 'bc1qsecondrecipient')
      ]),
      amountDisplayDenomination: mbtc,
      feeDisplayDenomination: mbtc
    })

    expect(rendered.getByText('bc1qfirstrecipient')).toBeTruthy()
    expect(rendered.getByText('bc1qsecondrecipient')).toBeTruthy()
    expect(rendered.getByText('1 ($ 0.00)')).toBeTruthy()
    expect(rendered.getByText('0.5 ($ 0.00)')).toBeTruthy()
    rendered.unmount()
  })

  it('shows a token amount in the token, not the parent currency', () => {
    const eth: EdgeDenomination = {
      multiplier: '1000000000000000000',
      name: 'ETH'
    }
    const rendered = renderModal({
      currencyInfo: ethCurrencyInfo,
      tokens: usdcTokens,
      replacedTx: makeTx('USDC', 'usdc', '-25000000', '0'),
      acceleratedTx: makeTx('USDC', 'usdc', '-25000000', '0', [
        makeTarget('USDC', '25000000', '0xrecipient')
      ]),
      amountDisplayDenomination: usdcTokens.usdc.denominations[0],
      feeDisplayDenomination: eth
    })

    expect(rendered.getByText('25 ($ 0.00)')).toBeTruthy()
    rendered.unmount()
  })

  it('omits the recipient rows when the plugin names no spend targets', () => {
    const rendered = renderModal({
      currencyInfo: btcCurrencyInfo,
      replacedTx: makeTx('BTC', null, '-681', '681'),
      acceleratedTx: makeTx('BTC', null, '-1362', '1362'),
      amountDisplayDenomination: mbtc,
      feeDisplayDenomination: mbtc
    })

    expect(rendered.queryByText('Recipient Address')).toBeNull()
    expect(rendered.queryByText('Send Amount')).toBeNull()
    rendered.unmount()
  })
})
