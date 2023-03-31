import { add, div, eq, mul } from 'biggystring'
import * as React from 'react'

import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { BorrowDebt, BorrowEngine } from '../../plugins/borrow-plugins/types'
import { useSelector } from '../../types/reactRedux'
import { GuiExchangeRates } from '../../types/types'
import { mulToPrecision } from '../../util/utils'
import { PercentageChangeArrowTile } from './PercentageChangeArrowTile'

interface Props {
  borrowEngine: BorrowEngine
  newDebt: BorrowDebt
}

const weightedAverage = (nums: string[], weights: string[]): string => {
  const [sum, weightSum] = weights.reduce(
    (acc, w, i) => {
      acc[0] = add(acc[0], mul(nums[i], w))
      acc[1] = add(acc[1], w)
      return acc
    },
    ['0', '0']
  )
  if (eq(weightSum, '0')) return '0'
  return div(sum, weightSum, 10)
}

const InterestRateChangeTileComponent = (props: Props) => {
  const { borrowEngine, newDebt } = props
  const { currencyWallet } = borrowEngine

  const debts = useWatch(borrowEngine, 'debts')

  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode
  } = currencyWallet

  // Define exchange rates
  const necessaryExchangeRates = [...debts, newDebt].reduce((pairs, obj) => {
    const { tokenId } = obj
    const { currencyCode } = tokenId == null ? currencyInfo : allTokens[tokenId]
    // @ts-expect-error
    pairs.push(`${currencyCode}_${fiatCurrencyCode}`)
    return pairs
  }, [])

  const exchangeRateMap = React.useRef<GuiExchangeRates>({})
  const exchangeRates = useHandler((pair: string) => exchangeRateMap.current[pair] ?? '0')
  useSelector(state => {
    necessaryExchangeRates.forEach(pair => {
      exchangeRateMap.current[pair] = state.exchangeRates[pair]
    })
  })

  // Existing debts
  const currentAprs = debts.map(debt => debt.apr.toString())
  const currentFiatAmounts = debts.map(debt => {
    const { tokenId } = debt
    const { currencyCode, denominations } = tokenId == null ? currencyInfo : allTokens[tokenId]
    const denom = denominations.find(denom => denom.name === currencyCode)
    const multiplier = denom?.multiplier ?? '1'
    return mul(div(debt.nativeAmount, multiplier, mulToPrecision(multiplier)), exchangeRates(`${currencyCode}_${fiatCurrencyCode}`))
  })

  // Incoming debt
  const { tokenId, nativeAmount, apr } = newDebt
  const { currencyCode, denominations } = tokenId == null ? currencyInfo : allTokens[tokenId]
  const denom = denominations.find(denom => denom.name === currencyCode)
  const multiplier = denom?.multiplier ?? '1'
  const incomingDebtFiatAmount = mul(div(nativeAmount, multiplier, mulToPrecision(multiplier)), exchangeRates(`${currencyCode}_${fiatCurrencyCode}`))

  const currentWeightedApr = React.useMemo(() => weightedAverage(currentAprs, currentFiatAmounts), [currentAprs, currentFiatAmounts])
  const futureWeightedApr = React.useMemo(
    () => weightedAverage([...currentAprs, apr.toString()], [...currentFiatAmounts, incomingDebtFiatAmount]),
    [currentAprs, apr, currentFiatAmounts, incomingDebtFiatAmount]
  )

  return <PercentageChangeArrowTile title={lstrings.loan_interest_rate} currentValue={currentWeightedApr} futureValue={futureWeightedApr} />
}

export const InterestRateChangeTile = React.memo(InterestRateChangeTileComponent)
