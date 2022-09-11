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

export const TotalFiatAmount = (wallet: EdgeCurrencyWallet, borrowArray: BorrowDebt[] | BorrowCollateral[]): string => {
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode: isoFiatCurrencyCode
  } = wallet

  // @ts-expect-error
  const necessaryExchangeRates = borrowArray.reduce((pairs, obj) => {
    const { tokenId } = obj
    const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId] ?? {}
    pairs.push(`${currencyCode}_${isoFiatCurrencyCode}`)
    return pairs
  }, [])

  const exchangeRateMap = useRef({ current: {} })
  // @ts-expect-error
  const exchangeRates = useHandler((pair: string) => exchangeRateMap.current[pair] ?? '0')
  // @ts-expect-error
  useSelector(state => {
    // @ts-expect-error
    necessaryExchangeRates.forEach(pair => {
      // @ts-expect-error
      exchangeRateMap.current[pair] = state.exchangeRates[pair]
    })
  })

  // @ts-expect-error
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
  // @ts-expect-error
  const exchangeRate = useSelector(state => state.exchangeRates[`${currencyCode}_${isoFiatCurrencyCode}`])

  // @ts-expect-error
  const exchangeDenominationMultiplier = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).multiplier)
  // @ts-expect-error
  const exchangeDenominationName = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).name)
  // @ts-expect-error
  const exchangeDenominationSymbol = useSelector(state => getExchangeDenomination(state, pluginId, currencyCode).symbol ?? '')

  // @ts-expect-error
  const displayDenominationMultiplier = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).multiplier)
  // @ts-expect-error
  const displayDenominationName = useSelector(state => getDisplayDenomination(state, pluginId, currencyCode).name)
  // @ts-expect-error
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
