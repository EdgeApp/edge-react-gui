import { add, div, gt, gte, log10, max, mul, sub, toFixed } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js/types'
import { sprintf } from 'sprintf-js'

import { MAX_AMOUNT } from '../constants/valueConstants'
import { makeActionProgram } from '../controllers/action-queue/ActionProgram'
import { ActionOp, ActionProgram, ParActionOp, SeqActionOp } from '../controllers/action-queue/types'
import { lstrings } from '../locales/strings'
import { BorrowCollateral, BorrowDebt, BorrowEngine } from '../plugins/borrow-plugins/types'
import { convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors'
import { config } from '../theme/appConfig'
import { GuiExchangeRates } from '../types/types'
import { getToken } from './CurrencyInfoHelpers'
import { enableToken } from './CurrencyWalletHelpers'
import { convertNativeToExchange, DECIMAL_PRECISION, getDenomFromIsoCode, maxPrimaryCurrencyConversionDecimals, precisionAdjust, zeroString } from './utils'

const MINIMUM_PARASWAP_AMOUNT = '100000' // Don't attempt paraswaps under 1 cent
const LIQUIDATION_THRESHOLD = '0.74'

// -----------------------------------------------------------------------------
//  Given the user inputs made in the AAVE UI, return the Actions needed to
//  create the ActionProgram.
// -----------------------------------------------------------------------------

export interface LoanAsset {
  wallet: EdgeCurrencyWallet
  nativeAmount: string
  paymentMethodId?: string
  tokenId?: string
}

interface AaveCreateActionParams {
  borrowEngineWallet: EdgeCurrencyWallet
  borrowPluginId: string

  source: LoanAsset
  destination: LoanAsset
}

interface AaveBorrowActionParams {
  borrowEngineWallet: EdgeCurrencyWallet
  borrowPluginId: string

  destination: LoanAsset
}

export const makeAaveCreateActionProgram = async (params: AaveCreateActionParams): Promise<ActionProgram> => {
  const { borrowEngineWallet, borrowPluginId, source, destination } = params
  const allTokens = borrowEngineWallet.currencyConfig.allTokens

  const sequenceActions: ActionOp[] = []
  const actionOp: ActionOp = {
    type: 'seq',
    actions: sequenceActions
  }

  //
  // Swap and Deposit steps
  //

  const depositToken = getToken(borrowEngineWallet, source.tokenId)

  // If no deposit token provided (i.e. buy from exchange provider), default to WBTC
  const depositTokenCc = depositToken == null ? 'WBTC' : depositToken.currencyCode
  await enableToken(depositTokenCc, borrowEngineWallet)

  const toTokenId = source.tokenId ?? Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'WBTC')

  // If deposit source wallet is not the borrowEngineWallet, swap first into the borrow engine wallet + deposit token before depositing.

  // Only from quotes supported for Polygon
  if (source.wallet.id !== borrowEngineWallet.id) {
    sequenceActions.push({
      type: 'swap',
      fromTokenId: source.tokenId,
      fromWalletId: source.wallet.id,
      nativeAmount: source.nativeAmount,
      toTokenId: toTokenId,
      toWalletId: borrowEngineWallet.id,
      amountFor: 'to',
      displayKey: 'swap-deposit'
    })
  }

  const loanParallelActions: ActionOp[] = []
  sequenceActions.push({
    type: 'par',
    actions: loanParallelActions,
    displayKey: 'create'
  })

  // Construct the deposit action
  loanParallelActions.push({
    type: 'loan-deposit',
    borrowPluginId,
    nativeAmount: source.nativeAmount,
    tokenId: toTokenId,
    walletId: borrowEngineWallet.id
  })

  //
  // Borrow and ACH steps
  //
  // HACK: par as top level ActionOp type not supported
  const borrowAction = ((await makeAaveBorrowAction({ borrowEngineWallet, borrowPluginId, destination })) as SeqActionOp).actions[0] as ParActionOp
  if (borrowAction.actions.length > 0) loanParallelActions.push(...borrowAction.actions)

  // Special complete message for withdraw to bank
  return await makeActionProgram(actionOp, {
    title: lstrings.action_display_title_complete_default,
    message:
      destination.paymentMethodId != null
        ? lstrings.action_display_message_complete_bank
        : sprintf(lstrings.action_display_message_complete_wallet_2s, getToken(borrowEngineWallet, destination.tokenId)?.currencyCode ?? 'NA', config.appName)
  })
}

export const makeAaveBorrowAction = async (params: AaveBorrowActionParams): Promise<ActionOp> => {
  const { borrowEngineWallet, borrowPluginId, destination } = params
  const allTokens = borrowEngineWallet.currencyConfig.allTokens

  //
  // Borrow and ACH steps
  //

  // HACK: par as top level ActionOp type not supported, so wrapping them in seq
  const sequenceActions: ActionOp[] = []
  const actionOp: ActionOp = {
    type: 'seq',
    actions: sequenceActions
  }
  const loanParallelActions: ActionOp[] = []
  sequenceActions.push({
    type: 'par',
    actions: loanParallelActions,
    displayKey: 'borrow'
  })

  const borrowToken = getToken(borrowEngineWallet, destination.tokenId)

  // If no borrow token specified (withdraw to bank), default to USDC for intermediate borrow step prior to withdrawing to bank
  const borrowTokenCc = borrowToken == null ? 'USDC' : borrowToken.currencyCode
  await enableToken(borrowTokenCc, borrowEngineWallet)

  // TODO: ASSUMPTION: The only borrow destinations are:
  // 1. USDC
  // 2. Bank (sell/fiat off-ramp), to be handled in a separate method
  if (borrowTokenCc !== 'USDC') throw new Error('Non-USDC token borrowing not yet implemented') // Should not happen...

  const defaultTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === borrowTokenCc)
  if (defaultTokenId == null) throw new Error(`Could not find default token ${borrowTokenCc} for borrow request`)

  // Construct the borrow action
  if (destination.tokenId != null || defaultTokenId != null)
    loanParallelActions.push({
      type: 'loan-borrow',
      borrowPluginId,
      nativeAmount: destination.nativeAmount,
      tokenId: destination.tokenId ?? defaultTokenId,
      walletId: borrowEngineWallet.id
    })

  // Construct the Withdraw to Bank action
  if (destination.paymentMethodId != null) {
    throw new Error('fiat-sell not implemented yet.')
  }

  return actionOp
}

export const makeAaveDepositAction = async ({
  borrowEngineWallet,
  borrowPluginId,
  depositTokenId,
  nativeAmount,
  srcTokenId,
  srcWallet
}: {
  borrowEngineWallet: EdgeCurrencyWallet
  borrowPluginId: string
  depositTokenId?: string
  nativeAmount: string
  srcTokenId?: string
  srcWallet: EdgeCurrencyWallet
}): Promise<ActionOp> => {
  const sequenceActions: ActionOp[] = []
  const actionOp: ActionOp = {
    type: 'seq',
    actions: sequenceActions
  }
  // TODO: Handle buy from fiat onramp in a separate method

  const depositToken = getToken(borrowEngineWallet, depositTokenId)

  // If no deposit token provided (i.e. buy from exchange provider), default to WBTC
  const depositTokenCc = depositToken == null ? 'WBTC' : depositToken.currencyCode
  await enableToken(depositTokenCc, borrowEngineWallet)
  const allTokens = borrowEngineWallet.currencyConfig.allTokens
  const tokenId = depositTokenId ?? Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'WBTC')

  // If deposit source wallet is not the borrowEngineWallet, swap first into the borrow engine wallet + deposit token before depositing.
  if (srcWallet.id !== borrowEngineWallet.id) {
    sequenceActions.push({
      type: 'swap',
      fromTokenId: srcTokenId,
      fromWalletId: srcWallet.id,
      nativeAmount,
      toTokenId: tokenId,
      toWalletId: borrowEngineWallet.id,
      amountFor: 'to',
      displayKey: 'swap-deposit'
    })
  }

  // Construct the deposit action
  sequenceActions.push({
    type: 'loan-deposit',
    borrowPluginId,
    nativeAmount,
    tokenId,
    walletId: borrowEngineWallet.id
  })

  return actionOp
}

export const makeAaveCloseAction = async ({
  borrowPluginId,
  borrowEngine,
  exchangeRates
}: {
  borrowPluginId: string
  borrowEngine: BorrowEngine
  exchangeRates: GuiExchangeRates
}): Promise<ActionOp | null> => {
  const { currencyWallet: wallet } = borrowEngine
  const { fiatCurrencyCode: isoFiatCurrencyCode } = wallet

  const evmActions: ActionOp[] = []

  // Only accept this request if the user has only singular debt/collateral assets
  const collaterals = borrowEngine.collaterals.filter(collateral => !zeroString(collateral.nativeAmount))
  const debts = borrowEngine.debts.filter(debt => !zeroString(debt.nativeAmount))

  // Closing loans with more than 1 debt/collateral is not supported because
  // we cannot make a judgement to determine which collateral asset to use to
  // repay debts.
  if (collaterals.length > 1 || debts.length > 1) throw new Error(lstrings.loan_close_multiple_asset_error)

  const collateral: BorrowCollateral | undefined = collaterals[0]
  const debt: BorrowDebt | undefined = debts[0]

  if (collateral != null) {
    const collateralTokenId = collateral.tokenId

    const collateralToken = getToken(wallet, collateralTokenId)
    if (collateralToken == null) throw new Error('Unable to find collateral EdgeToken')

    const { currencyCode: collateralCurrencyCode, denominations: collateralDenoms } = collateralToken

    // We must ensure the token is enabled to get the user's token balance and
    // calculate exchange rates
    await enableToken(collateralCurrencyCode, wallet)

    if (debt != null) {
      const debtTokenId = debt.tokenId
      const debtToken = getToken(wallet, debtTokenId)
      if (debtToken == null) throw new Error('Unable to find debt EdgeToken')

      const { currencyCode: debtCurrencyCode, denominations: debtDenoms } = debtToken

      // We must ensure the token is enabled to get the user's token balance
      // and calculate exchange rates
      await enableToken(debtCurrencyCode, wallet)

      // #region Swap Validation

      const collateralDenom = collateralDenoms[0]
      const collateralFiat = convertCurrencyFromExchangeRates(
        exchangeRates,
        collateralCurrencyCode,
        isoFiatCurrencyCode,
        convertNativeToExchange(collateralDenom.multiplier)(collateral.nativeAmount)
      )
      const debtDenom = debtDenoms[0]
      const principalFiat = convertCurrencyFromExchangeRates(
        exchangeRates,
        debtCurrencyCode,
        isoFiatCurrencyCode,
        convertNativeToExchange(debtDenom.multiplier)(debt.nativeAmount)
      )
      const debtBalanceNativeAmount = wallet.balances[debtCurrencyCode]
      const debtBalanceFiat = convertCurrencyFromExchangeRates(
        exchangeRates,
        debtCurrencyCode,
        isoFiatCurrencyCode,
        convertNativeToExchange(debtDenom.multiplier)(debtBalanceNativeAmount)
      )

      // Find maximum amount of principal that can remain in the loan such that
      // a repay with collateral pays off the entirety of the loan AND remains
      // above the LIQUIDATION_THRESHOLD.
      const maxRemainingPrincipalFiat = div(mul(collateralFiat, LIQUIDATION_THRESHOLD), add('1', LIQUIDATION_THRESHOLD), DECIMAL_PRECISION)

      // Check if the user has enough to bring the principal down to the
      // maxRemainingPrincipal
      const remainingPrincipalFiat = sub(principalFiat, debtBalanceFiat)
      if (gt(remainingPrincipalFiat, maxRemainingPrincipalFiat)) {
        // Inform the user of the deficit that must be covered with either
        // an additional deposit or debt balance in order to close the loan
        const debtBalanceDeficitFiat = sub(remainingPrincipalFiat, maxRemainingPrincipalFiat)

        const collateralDeficitFiat = sub(
          div(mul(add('1', LIQUIDATION_THRESHOLD), remainingPrincipalFiat), LIQUIDATION_THRESHOLD, DECIMAL_PRECISION),
          collateralFiat
        )
        const collateralDeficitAmount = div(collateralDeficitFiat, exchangeRates[`${collateralCurrencyCode}_${isoFiatCurrencyCode}`], DECIMAL_PRECISION)

        const collateralPrecisionAdjust = precisionAdjust({
          primaryExchangeMultiplier: collateralDenom.multiplier,
          secondaryExchangeMultiplier: getDenomFromIsoCode(isoFiatCurrencyCode).multiplier,
          exchangeSecondaryToPrimaryRatio: exchangeRates[`${collateralCurrencyCode}_${isoFiatCurrencyCode}`]
        })
        const collateralMaxPrecision = maxPrimaryCurrencyConversionDecimals(log10(collateralDenom.multiplier), collateralPrecisionAdjust)

        throw new Error(
          sprintf(
            lstrings.loan_close_insufficient_funds_4s,
            toFixed(debtBalanceDeficitFiat, 0, 2),
            debtCurrencyCode,
            toFixed(collateralDeficitAmount, 0, collateralMaxPrecision),
            collateralCurrencyCode
          )
        )
      }

      // #endregion Swap Validation

      // Repay actions
      let repayWithBalanceNativeAmount = '0'
      let repayWithCollateralNativeAmount = '0'
      if (gte(debtBalanceNativeAmount, debt.nativeAmount)) {
        // If the user does has enough debt balance to fully cover the principal,
        // simply repay the full amount from the wallet balance
        repayWithBalanceNativeAmount = debt.nativeAmount
      } else {
        // If the user does not have enough debt balance to fully cover the principal,
        // first repay with the maximum debt balance such that the following repay
        // with collateral will not fail due to not meeting paraswap minimums
        repayWithCollateralNativeAmount = max(sub(debt.nativeAmount, debtBalanceNativeAmount), MINIMUM_PARASWAP_AMOUNT)
        repayWithBalanceNativeAmount = sub(debt.nativeAmount, repayWithCollateralNativeAmount)
      }

      // Repay with balance actions
      if (!zeroString(repayWithBalanceNativeAmount))
        evmActions.push({
          type: 'loan-repay',
          nativeAmount: repayWithBalanceNativeAmount,
          borrowPluginId,
          tokenId: debtTokenId,
          walletId: wallet.id
        })

      // Repay with collateral actions
      if (!zeroString(repayWithCollateralNativeAmount))
        evmActions.push({
          type: 'loan-repay',
          nativeAmount: repayWithCollateralNativeAmount,
          borrowPluginId,
          fromTokenId: collateralTokenId,
          tokenId: debtTokenId,
          walletId: wallet.id
        })
    }

    // Withdraw action
    evmActions.push({
      type: 'loan-withdraw',
      borrowPluginId,
      nativeAmount: MAX_AMOUNT.toString(),
      tokenId: collateralTokenId,
      walletId: wallet.id
    })
  }

  return evmActions.length > 0
    ? {
        type: 'seq',
        actions: [
          {
            type: 'par',
            actions: evmActions,
            displayKey: 'close'
          }
        ]
      }
    : null
}
