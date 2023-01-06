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
import s from '../../locales/strings'
import { useDispatch, useSelector } from '../../types/reactRedux'
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

  const state = useSelector(state => state)
  const allTokens = useAllTokens(account)

  //
  // Initialization
  //

  useAsyncEffect(async () => {
    if (account.disklet != null) {
      dispatch(loadLoanAccounts(account))
    }
  }, [account, dispatch])

  //
  // Cleanup Routine
  //

  React.useEffect(() => {
    const routine = () => {
      for (const loanAccount of Object.values(loanAccountMap)) {
        if (!checkLoanHasFunds(loanAccount) && loanAccount.closed) {
          dispatch(deleteLoanAccount(loanAccount))
        }
      }
    }
    const intervalId = setInterval(routine, 3000)
    return () => {
      clearInterval(intervalId)
    }
  }, [dispatch, loanAccountMap])

  //
  // Update Liquidation Threshold Push Event
  //
  React.useEffect(() => {
    const routine = async () => {
      for (const loanAccount of Object.values(loanAccountMap)) {
        const { borrowEngine } = loanAccount
        await waitForBorrowEngineSync(borrowEngine)
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
          const getCurrencyCode = (tokenId?: string): string => {
            const tokens = allTokens[borrowEngine.currencyWallet.currencyInfo.pluginId]
            const token = tokenId != null ? tokens[tokenId] : undefined
            return token?.currencyCode ?? borrowEngine.currencyWallet.currencyInfo.currencyCode
          }

          const debtFiatAmounts = filteredDebts.map(debt => {
            const debtExchangeAmount = getExchangeAmount(debt.tokenId, debt.nativeAmount)
            // We assume all debts are stable-coins and therefore USD equivalent
            return debtExchangeAmount
          })
          const debtFiatTotal = debtFiatAmounts.reduce((sum, debtFiatAmount) => add(sum, debtFiatAmount), '0')

          const collateral = filteredCollaterals[0]
          const collateralCurrencyCode = getCurrencyCode(collateral.tokenId)
          const collateralExchangeAmount = getExchangeAmount(collateral.tokenId, collateral.nativeAmount)

          const thresholdRate = parseFloat(div(debtFiatTotal, mul(collateralExchangeAmount, ALERT_THRESHOLD_LTV), DECIMAL_PRECISION))

          const pushClient = makePushClient(account, clientId)

          const eventId = `${loanAccount.id}:ltv_alert`
          const trigger: PushTrigger = {
            type: 'price-level',
            currencyPair: `${collateralCurrencyCode}_iso:USD`,
            belowRate: thresholdRate
          }
          const pushMessage: PushMessage = {
            title: s.strings.loan_notification_ltv_threshold_alert_title,
            body: s.strings.loan_notification_ltv_threshold_alert_message
          }
          const newPushEvent: NewPushEvent = { eventId, trigger, pushMessage }
          const loginUpdatePayload: LoginUpdatePayload = {
            createEvents: [newPushEvent]
          }

          await pushClient.uploadPushEvents(loginUpdatePayload)
        }
      }
    }

    // Run immediately
    routine()

    // Refresh every 10 minutes
    const intervalId = setInterval(routine, 3000)

    return () => {
      clearInterval(intervalId)
    }
  }, [account, allTokens, clientId, loanAccountMap, state])

  return null
}
