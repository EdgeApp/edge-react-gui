import { div, gt, gte, lt, max, mul, sub } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js/types'
import { sprintf } from 'sprintf-js'

import { MAX_AMOUNT } from '../constants/valueConstants'
import { makeActionProgram } from '../controllers/action-queue/ActionProgram'
import { ActionOp, ActionProgram, ParActionOp, SeqActionOp } from '../controllers/action-queue/types'
import s from '../locales/strings'
import { BorrowEngine } from '../plugins/borrow-plugins/types'
import { convertCurrencyFromExchangeRates } from '../selectors/WalletSelectors'
import { config } from '../theme/appConfig'
import { GuiExchangeRates } from '../types/types'
import { getToken } from './CurrencyInfoHelpers'
import { enableToken } from './CurrencyWalletHelpers'
import { zeroString } from './utils'

const MINIMUM_PARASWAP_AMOUNT = '100000' // Don't attempt paraswaps under 1 cent

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
  return makeActionProgram(actionOp, {
    title: s.strings.action_display_title_complete_default,
    message:
      destination.paymentMethodId != null
        ? s.strings.action_display_message_complete_bank
        : sprintf(s.strings.action_display_message_complete_wallet_2s, getToken(borrowEngineWallet, destination.tokenId)?.currencyCode ?? 'NA', config.appName)
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
    actions: loanParallelActions
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
    loanParallelActions.push({
      type: 'wyre-sell',
      wyreAccountId: destination.paymentMethodId,
      nativeAmount: destination.nativeAmount,
      tokenId: destination.tokenId ?? defaultTokenId,
      walletId: borrowEngineWallet.id
    })
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

  // #region Validation

  // Only accept this request if the user has only singular debt/collateral assets
  const collaterals = borrowEngine.collaterals.filter(collateral => !zeroString(collateral.nativeAmount))
  const debts = borrowEngine.debts.filter(debt => !zeroString(debt.nativeAmount))
  if (debts.length === 0) return null

  if (collaterals.length > 1 || debts.length > 1) throw new Error(s.strings.loan_close_multiple_asset_error)

  // Reject this close action if the user does not have enough debt token
  // balance in their wallet to partially repay such that:
  // D / (C - D) <= 74% LTV, where C = collateral in fiat, D = debt in fiat
  // In other words, target debt balance prior to swapping = (37 * C) / 87
  const {
    currencyConfig: { allTokens },
    currencyInfo,
    fiatCurrencyCode: isoFiatCurrencyCode
  } = wallet

  const collateral = collaterals[0]
  const collateralTokenId = collateral.tokenId
  const debt = debts[0]
  const debtTokenId = debt.tokenId
  if (debtTokenId == null) throw new Error('Could not find debt tokenId') // Should not happen...

  const { currencyCode: collateralCurrencyCode } = collateral.tokenId == null ? currencyInfo : allTokens[collateral.tokenId] ?? {}
  const { currencyCode: debtCurrencyCode } = debt.tokenId == null ? currencyInfo : allTokens[debt.tokenId] ?? {}
  const collateralFiat = convertCurrencyFromExchangeRates(exchangeRates, collateralCurrencyCode, isoFiatCurrencyCode, collateral.nativeAmount)
  const principalFiat = convertCurrencyFromExchangeRates(exchangeRates, debtCurrencyCode, isoFiatCurrencyCode, debt.nativeAmount)
  const debtBalanceNativeAmount = wallet.balances[debtCurrencyCode]
  const debtBalanceFiat = convertCurrencyFromExchangeRates(exchangeRates, debtCurrencyCode, isoFiatCurrencyCode, debtBalanceNativeAmount)

  // Target principal we want to arrive at after initial repayment from balance
  const targetPrincipalFiat = div(mul('37', collateralFiat), '87')
  const targetPrincipalFiatDeficit = gt(principalFiat, targetPrincipalFiat) ? sub(principalFiat, targetPrincipalFiat) : '0'

  // Check if we have enough debt token to arrive at that deficit
  if (lt(debtBalanceFiat, targetPrincipalFiatDeficit))
    throw new Error(sprintf(s.strings.loan_close_insufficient_funds_2s, sub(targetPrincipalFiatDeficit, debtBalanceFiat), debtCurrencyCode))

  // #endregion Validation

  const seqAction: SeqActionOp = {
    type: 'seq',
    actions: []
  }

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

  // Construct repay with balance
  if (!zeroString(repayWithBalanceNativeAmount))
    seqAction.actions.push({
      type: 'loan-repay',
      nativeAmount: repayWithBalanceNativeAmount,
      borrowPluginId,
      tokenId: debtTokenId,
      walletId: wallet.id
    })

  // Construct repay with collateral
  if (!zeroString(repayWithCollateralNativeAmount))
    seqAction.actions.push({
      type: 'loan-repay',
      nativeAmount: repayWithCollateralNativeAmount,
      borrowPluginId,
      fromTokenId: collateralTokenId,
      tokenId: debtTokenId,
      walletId: wallet.id
    })

  // Withdraw actions
  const withdrawalToken = getToken(wallet, collateralTokenId)
  if (withdrawalToken != null) {
    // Make sure the collateralized token is enabled just because
    await enableToken(withdrawalToken.currencyCode, wallet)

    seqAction.actions.push({
      type: 'loan-withdraw',
      borrowPluginId,
      nativeAmount: MAX_AMOUNT.toString(),
      tokenId: collateralTokenId,
      walletId: wallet.id
    })
  }

  if (seqAction.actions.length > 0) {
    return seqAction
  }

  // Returning null means no transactions are necessary in order to close the loan
  return null
}
