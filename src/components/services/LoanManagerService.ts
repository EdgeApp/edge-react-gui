import { add, div, mul } from 'biggystring'
import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'

import { LoginUpdatePayload, NewPushEvent } from '../../controllers/action-queue/types/pushApiTypes'
import { PushMessage, PushTrigger } from '../../controllers/action-queue/types/pushTypes'
import { deleteLoanAccount, loadLoanAccounts } from '../../controllers/loan-manager/redux/actions'
import { LoanAccountMap } from '../../controllers/loan-manager/types'
import { checkLoanHasFunds } from '../../controllers/loan-manager/util/checkLoanHasFunds'
import { waitForBorrowEngineSync } from '../../controllers/loan-manager/util/waitForLoanAccountSync'
import { useAllTokens } from '../../hooks/useAllTokens'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { lstrings } from '../../locales/strings'
import { BorrowEngine } from '../../plugins/borrow-plugins/types'
import { useState } from '../../types/reactHooks'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { makePeriodicTask } from '../../util/PeriodicTask'
import { makePushClient } from '../../util/PushClient/PushClient'
import { DECIMAL_PRECISION, zeroString } from '../../util/utils'

interface Props {
  account: EdgeAccount
}

// Hard-coded token ids which we know to be USD-based debt
const USD_BASED_TOKEN_IDS: string[] = [
  // USDC on Ethereum
  'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  // USDT on Ethereum
  'dac17f958d2ee523a2206206994597c13d831ec7',
  // DAI on Ethereum
  '6b175474e89094c44da98b954eedeac495271d0f',
  // USDC on Polygon
  '2791bca1f2de4661ed88a30c99a7a9449aa84174',
  // USDT on Polygon
  'c2132d05d31c914a87c6611c10748aeb04b58e8f',
  // DAI on Polygon
  '8f3cf7ad23cd3cadbd9735aff958023239c6a063'
]
const ALERT_THRESHOLD_LTV = '0.7'

export const LoanManagerService = (props: Props) => {
  const { account } = props
  const dispatch = useDispatch()
  const clientId: string = useSelector(state => state.core.context.clientId)
  const loanAccountMap: LoanAccountMap = useSelector(state => state.loanManager.loanAccounts)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const allTokens = useAllTokens(account)

  const [cachedLoanAssetsMap, setCachedLoanAssetsMap] = useState<{ [loanAccountId: string]: string }>({})

  //
  // Initialization
  //

  useAsyncEffect(
    async () => {
      if (account.disklet != null) {
        await dispatch(loadLoanAccounts(account))
      }
    },
    [account, dispatch],
    'LoanManagerService 1'
  )

  //
  // Cleanup Routine
  //

  React.useEffect(() => {
    const routine = () => {
      for (const loanAccount of Object.values(loanAccountMap)) {
        if (!checkLoanHasFunds(loanAccount) && loanAccount.closed) {
          dispatch(deleteLoanAccount(loanAccount)).catch(err => console.warn(err))

          cachedLoanAssetsMap[loanAccount.id] = ''
          setCachedLoanAssetsMap({ ...cachedLoanAssetsMap })
        }
      }
    }
    const intervalId = setInterval(routine, 3000)
    return () => {
      clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, loanAccountMap])

  //
  // Update Liquidation Threshold Push Event
  //
  const getCurrencyCode = React.useCallback(
    (borrowEngine: BorrowEngine, tokenId?: string): string => {
      const tokens = allTokens[borrowEngine.currencyWallet.currencyInfo.pluginId]
      const token = tokenId != null ? tokens[tokenId] : undefined
      return token?.currencyCode ?? borrowEngine.currencyWallet.currencyInfo.currencyCode
    },
    [allTokens]
  )

  // Cache changes to specific watched properties of the loan accounts to detect
  // deltas
  useAsyncEffect(
    async () => {
      for (const loanAccountId of Object.keys(loanAccountMap)) {
        await waitForBorrowEngineSync(loanAccountMap[loanAccountId].borrowEngine)
        const { borrowEngine } = loanAccountMap[loanAccountId]
        const { debts, collaterals } = borrowEngine

        // Cache accounts only if we can support liquidation price calculations
        const filteredDebts = debts.filter(debt => !zeroString(debt.nativeAmount))
        const filteredCollaterals = collaterals.filter(collateral => !zeroString(collateral.nativeAmount))
        const onlyOneCollateral = filteredCollaterals.length === 1
        // TODO: Find a less crude way to determine if a token is USD-based
        const onlyUsdBasedDebts = filteredDebts.every(debt => (debt.tokenId != null ? USD_BASED_TOKEN_IDS.includes(debt.tokenId.toLowerCase()) : false))

        if (onlyOneCollateral && onlyUsdBasedDebts) {
          // Only trigger push events after the exchange rates are available for
          // all loan assets on this account
          const loanAssetTokenIds = [...filteredDebts, ...filteredCollaterals].map(loanAsset => loanAsset.tokenId)
          if (loanAssetTokenIds.every(tokenId => tokenId == null || !zeroString(exchangeRates[`${getCurrencyCode(borrowEngine, tokenId)}_iso:USD`]))) {
            if (debts.length > 0) {
              // If it's the first time the account has been seen, we want to
              // avoid a notification if it already exceeds the liquidation price
              // right when the app is booted. Newly created loans can never
              // exceed the liquidation price.
              if (cachedLoanAssetsMap[loanAccountId] == null) {
                cachedLoanAssetsMap[loanAccountId] = JSON.stringify([...debts, ...collaterals])
                await uploadLiquidationPushEvents(loanAccountId, false)
              }
              // If we already have a cache of this account and the LTV changed,
              // upload a push notification even if the liquidation price has been
              // exceeded
              else if (JSON.stringify([...debts, ...collaterals]) !== cachedLoanAssetsMap[loanAccountId]) {
                cachedLoanAssetsMap[loanAccountId] = JSON.stringify([...debts, ...collaterals])
                await uploadLiquidationPushEvents(loanAccountId, true)
              }
            } else {
              // Ensure push event is cleared if account is closed or debts no
              // longer exist
              await uploadLiquidationPushEvents(loanAccountId, false)
            }
          }
        }
        setCachedLoanAssetsMap({ ...cachedLoanAssetsMap })
      }
    },
    [loanAccountMap, exchangeRates],
    'LoanManagerService 2'
  )

  const uploadLiquidationPushEvents = React.useCallback(
    async (loanAccountId: string, isSkipPriceCheck: boolean) => {
      const uploadLiquidationEvent = async (currencyPair: string, thresholdRate: number) => {
        const eventId = `${loanAccountId}:ltv_alert`
        const trigger: PushTrigger = {
          type: 'price-level',
          currencyPair,
          belowRate: thresholdRate
        }
        const pushMessage: PushMessage = {
          title: lstrings.loan_notification_ltv_threshold_alert_title,
          body: lstrings.loan_notification_ltv_threshold_alert_message
        }
        const newPushEvent: NewPushEvent = { eventId, trigger, pushMessage }
        const loginUpdatePayload: LoginUpdatePayload = {
          createEvents: [newPushEvent]
        }

        const pushClient = makePushClient(account, clientId)
        await pushClient.uploadPushEvents(loginUpdatePayload)
      }

      // TODO: Implement a true way to clear the push event
      if (cachedLoanAssetsMap[loanAccountId] === '') {
        uploadLiquidationEvent('WBTC', 0).catch(err => console.warn(err))
        return
      }

      await waitForBorrowEngineSync(loanAccountMap[loanAccountId].borrowEngine)
      const { borrowEngine } = loanAccountMap[loanAccountId]
      const { debts, collaterals } = borrowEngine
      const filteredDebts = debts.filter(debt => !zeroString(debt.nativeAmount))
      const filteredCollaterals = collaterals.filter(collateral => !zeroString(collateral.nativeAmount))
      const onlyOneCollateral = filteredCollaterals.length === 1
      // TODO: Find a less crude way to determine if a token is USD-based
      const onlyUsdBasedDebts = filteredDebts.every(debt => (debt.tokenId != null ? USD_BASED_TOKEN_IDS.includes(debt.tokenId.toLowerCase()) : false))

      if (onlyOneCollateral && onlyUsdBasedDebts) {
        const getExchangeAmount = (tokenId: string | undefined, nativeAmount: string): string => {
          const tokens = allTokens[borrowEngine.currencyWallet.currencyInfo.pluginId]
          const token = tokenId != null ? tokens[tokenId] : undefined
          const denom = token != null ? token.denominations[0] : borrowEngine.currencyWallet.currencyInfo.denominations[0]
          return div(nativeAmount, denom.multiplier, DECIMAL_PRECISION)
        }

        const debtFiatAmounts = filteredDebts.map(debt => {
          const debtExchangeAmount = getExchangeAmount(debt.tokenId, debt.nativeAmount)
          // We assume all debts are stable-coins and therefore USD equivalent
          return debtExchangeAmount
        })
        const debtFiatTotal = debtFiatAmounts.reduce((sum, debtFiatAmount) => add(sum, debtFiatAmount), '0')

        const collateral = filteredCollaterals[0]
        const collateralCurrencyCode = getCurrencyCode(borrowEngine, collateral.tokenId)
        const collateralExchangeAmount = getExchangeAmount(collateral.tokenId, collateral.nativeAmount)

        const thresholdRate = parseFloat(div(debtFiatTotal, mul(collateralExchangeAmount, ALERT_THRESHOLD_LTV), DECIMAL_PRECISION))
        const currencyPair = `${collateralCurrencyCode}_iso:USD`

        if (isSkipPriceCheck || parseFloat(exchangeRates[currencyPair]) > thresholdRate) {
          await uploadLiquidationEvent(currencyPair, thresholdRate)
        }
      }
    },
    [account, allTokens, cachedLoanAssetsMap, clientId, exchangeRates, getCurrencyCode, loanAccountMap]
  )

  // Always periodically send fresh push events in case price bounces around
  // the liquidation threshold while the app is open
  React.useEffect(() => {
    const task = makePeriodicTask(async () => {
      for (const loanAccountId of Object.keys(loanAccountMap)) {
        await uploadLiquidationPushEvents(loanAccountId, true)
      }
    }, 10 * 60 * 1000)
    task.start({ wait: true })
    return () => {
      task.stop()
    }
  }, [loanAccountMap, uploadLiquidationPushEvents])

  return null
}
