import { add, div, mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useCryptoText } from '../../hooks/useCryptoText'
import { formatFiatString, useFiatText } from '../../hooks/useFiatText'
import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { BorrowCollateral, BorrowDebt } from '../../plugins/borrow-plugins/types'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { useRef } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { getDenomFromIsoCode, mulToPrecision } from '../../util/utils'
import { Tile } from '../tiles/Tile'

export const ExchangeRateTile = (props: { wallet: EdgeCurrencyWallet; tokenId?: string }) => {
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

// @ts-expect-error - Flow doesn't like that BorrowCollateral doesn't have an apr key despite that value not being relevant anywhere in this function. It doesn't even appear in this file.
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

export const DebtAmountTile = (props: { title: string; wallet: EdgeCurrencyWallet; debts: BorrowDebt[] }) => {
  const { title, wallet, debts } = props
  const fiatDenomination = getDenomFromIsoCode(wallet.fiatCurrencyCode)

  const totalFiatAmount = TotalFiatAmount(wallet, debts)

  const body = `${fiatDenomination.symbol ?? ''} ${formatFiatString({ autoPrecision: true, fiatAmount: totalFiatAmount, noGrouping: true })}`

  return <Tile title={title} body={body} type="static" />
}

export const CollateralAmountTile = (props: { title: string; wallet: EdgeCurrencyWallet; collaterals: BorrowCollateral[] }) => {
  const { title, wallet, collaterals } = props
  const fiatDenomination = getDenomFromIsoCode(wallet.fiatCurrencyCode)

  const totalFiatAmount = TotalFiatAmount(wallet, collaterals)
  const body = `${fiatDenomination.symbol ?? ''} ${formatFiatString({ autoPrecision: true, fiatAmount: totalFiatAmount, noGrouping: true })}`

  return <Tile title={title} body={body} type="static" />
}

export const NetworkFeeTile = (props: { wallet: EdgeCurrencyWallet; nativeAmount: string }) => {
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
