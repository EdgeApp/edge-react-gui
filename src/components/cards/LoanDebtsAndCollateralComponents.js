// @flow

import { add, div, mul } from 'biggystring'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useCryptoText } from '../../hooks/useCryptoText.js'
import { formatFiatString, useFiatText } from '../../hooks/useFiatText.js'
import { useHandler } from '../../hooks/useHandler.js'
import s from '../../locales/strings.js'
import type { BorrowCollateral, BorrowDebt } from '../../plugins/borrow-plugins/types.js'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { useRef } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { getDenomFromIsoCode, mulToPrecision } from '../../util/utils.js'
import { Tile } from '../tiles/Tile.js'

export const ExchangeRateTile = (props: { wallet: EdgeCurrencyWallet, tokenId?: string }) => {
  const {
    wallet: {
      currencyConfig: { allTokens },
      currencyInfo,
      fiatCurrencyCode: isoFiatCurrencyCode
    },
    tokenId
  } = props
  const { multiplier } = getDenomFromIsoCode(isoFiatCurrencyCode)

  const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId] ?? {}

  const exchangeRateFiatAmount = useFiatText({
    appendFiatCurrencyCode: false,
    autoPrecision: false,
    cryptoCurrencyCode: currencyCode,
    cryptoExchangeMultiplier: multiplier,
    fiatSymbolSpace: false,
    isoFiatCurrencyCode: isoFiatCurrencyCode,
    nativeCryptoAmount: multiplier
  })

  const title = `${currencyCode} ${s.strings.loan_exchange_rate}`
  const body = `1 ${currencyCode} = ${exchangeRateFiatAmount}`

  return <Tile title={title} body={body} type="static" />
}

// $FlowFixMe - Flow doesn't like that BorrowCollateral doesn't have an apr key despite that value not being relevant anywhere in this function. It doesn't even appear in this file.
export const TotalFiatAmount = (wallet: EdgeCurrencyWallet, borrowArray: BorrowDebt[] | BorrowCollateral[]): string => {
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode: isoFiatCurrencyCode
  } = wallet

  const necessaryExchangeRates = borrowArray.reduce((pairs, obj) => {
    const { tokenId } = obj
    const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId] ?? {}
    pairs.push(`${currencyCode}_${isoFiatCurrencyCode}`)
    return pairs
  }, [])

  const exchangeRateMap = useRef({ current: {} })
  const exchangeRates = useHandler((pair: string) => exchangeRateMap.current[pair] ?? '0')
  useSelector(state => {
    necessaryExchangeRates.forEach(pair => {
      exchangeRateMap.current[pair] = state.exchangeRates[pair]
    })
  })

  return borrowArray.reduce((total, obj) => {
    const { currencyCode, denominations } = obj.tokenId == null ? currencyInfo : allTokens[obj.tokenId] ?? {}
    const denom = denominations.find(denom => denom.name === currencyCode)
    const multiplier = denom?.multiplier ?? '1'
    return add(total, mul(div(obj.nativeAmount, multiplier, mulToPrecision(multiplier)), exchangeRates(`${currencyCode}_${isoFiatCurrencyCode}`)))
  }, '0')
}

export const DebtAmountTile = (props: { title: string, wallet: EdgeCurrencyWallet, debts: BorrowDebt[] }) => {
  const { title, wallet, debts } = props
  const fiatDenomination = getDenomFromIsoCode(wallet.fiatCurrencyCode)

  const totalFiatAmount = TotalFiatAmount(wallet, debts)

  const body = `${fiatDenomination.symbol ?? ''} ${formatFiatString({ autoPrecision: true, fiatAmount: totalFiatAmount, noGrouping: true })}`

  return <Tile title={title} body={body} type="static" />
}

export const CollateralAmountTile = (props: { title: string, wallet: EdgeCurrencyWallet, collaterals: BorrowCollateral[] }) => {
  const { title, wallet, collaterals } = props
  const fiatDenomination = getDenomFromIsoCode(wallet.fiatCurrencyCode)

  const totalFiatAmount = TotalFiatAmount(wallet, collaterals)
  const body = `${fiatDenomination.symbol ?? ''} ${formatFiatString({ autoPrecision: true, fiatAmount: totalFiatAmount, noGrouping: true })}`

  return <Tile title={title} body={body} type="static" />
}

export const NetworkFeeTile = (props: { wallet: EdgeCurrencyWallet, nativeAmount: string }) => {
  const {
    wallet: {
      currencyInfo: { pluginId, currencyCode },
      fiatCurrencyCode: isoFiatCurrencyCode
    },
    nativeAmount
  } = props

  const fiatDenomination = getDenomFromIsoCode(isoFiatCurrencyCode)
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`])

  const exchangeDenominationMultiplier = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).multiplier)
  const exchangeDenominationName = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).name)
  const exchangeDenominationSymbol = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).symbol ?? '')

  const displayDenominationMultiplier = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).multiplier)
  const displayDenominationName = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).name)
  const displayDenominationSymbol = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).symbol ?? '')

  const feeCryptoAmount = useCryptoText({
    displayDenomination: {
      multiplier: displayDenominationMultiplier,
      name: displayDenominationName,
      symbol: displayDenominationSymbol
    },
    exchangeDenomination: {
      multiplier: exchangeDenominationMultiplier,
      name: exchangeDenominationName,
      symbol: exchangeDenominationSymbol
    },
    fiatDenomination,
    exchangeRate,
    nativeAmount: nativeAmount
  })

  const feeFiatAmount = useFiatText({
    appendFiatCurrencyCode: false,
    autoPrecision: true,
    cryptoCurrencyCode: currencyCode,
    cryptoExchangeMultiplier: exchangeDenominationMultiplier,
    fiatSymbolSpace: true,
    isoFiatCurrencyCode,
    nativeCryptoAmount: nativeAmount
  })

  const title = s.strings.loan_estimate_fee
  const body = `${feeCryptoAmount} (${feeFiatAmount})`

  return <Tile type="static" title={title} body={body} />
}
