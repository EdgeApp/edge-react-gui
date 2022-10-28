import { div, mul } from 'biggystring'
import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js/types'

import { MAX_AMOUNT } from '../constants/valueConstants'
import { ActionOp, ParActionOp, SeqActionOp } from '../controllers/action-queue/types'
import { BorrowEngine } from '../plugins/borrow-plugins/types'
import { RootState } from '../reducers/RootReducer'
import { getToken } from './CurrencyInfoHelpers'
import { enableToken } from './CurrencyWalletHelpers'
import { DECIMAL_PRECISION, truncateDecimals, zeroString } from './utils'

// -----------------------------------------------------------------------------
//  Given the user inputs made in the AAVE UI, return the Actions needed to
//  create the ActionProgram.
// -----------------------------------------------------------------------------

export interface LoanAsset {
  wallet: EdgeCurrencyWallet
  nativeAmount: string
  paymentMethodId?: string
  tokenId?: string
  edgeToken?: EdgeToken
  fiatRate?: string
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

interface AaveRepayActionParams {
  borrowEngineWallet: EdgeCurrencyWallet
  borrowPluginId: string

  source: LoanAsset
  destination: LoanAsset
}

export const makeAaveCreateAction = async (params: AaveCreateActionParams): Promise<ActionOp> => {
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
  if (source.wallet.id !== borrowEngineWallet.id) {
    sequenceActions.push({
      type: 'swap',
      fromTokenId: source.tokenId,
      fromWalletId: source.wallet.id,
      nativeAmount: source.nativeAmount, // Though nativeAmount from is given, this value is actually represents swap output amount in terms of toTokenId/toWalletId
      toTokenId: toTokenId,
      toWalletId: borrowEngineWallet.id,
      amountFor: 'to'
    })
  }

  const loanParallelActions: ActionOp[] = []
  sequenceActions.push({
    type: 'par',
    actions: loanParallelActions
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

  return actionOp
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
      amountFor: 'to'
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

export const makeAaveRepayAction = async (params: AaveRepayActionParams): Promise<ActionOp> => {
  const { borrowEngineWallet, borrowPluginId, source, destination } = params

  const actionOp: ActionOp = {
    type: 'seq',
    actions: []
  }

  if (source.wallet.id !== borrowEngineWallet.id) {
    const { edgeToken: sourceToken, fiatRate: sourceFiatRate } = source
    const { edgeToken: destinationToken, fiatRate: destinationFiatRate } = destination
    if (destinationToken == null) throw new Error('Repaying with swap requires destination EdgeToken')
    if (destinationFiatRate == null || sourceFiatRate == null) throw new Error('Repaying with swap requires fiat rates')

    // Calculate how much source asset we need:
    const sourceDenoms = sourceToken != null ? sourceToken.denominations : source.wallet.currencyInfo.denominations
    const sourceExchangeMultiplier = sourceDenoms == null ? '0' : sourceDenoms[0].multiplier
    const destinationDenoms = destinationToken != null ? destinationToken.denominations : destination.wallet.currencyInfo.denominations
    const destinationExchangeMultiplier = destinationDenoms == null ? '0' : destinationDenoms[0].multiplier

    const destinationAmount = div(destination.nativeAmount, destinationExchangeMultiplier, DECIMAL_PRECISION)
    const requiredFiat = mul(destinationAmount, destinationFiatRate)
    const sourceNativeAmount = truncateDecimals(mul(sourceExchangeMultiplier, div(requiredFiat, sourceFiatRate, DECIMAL_PRECISION)), 0)

    actionOp.actions.push({
      type: 'swap',
      fromTokenId: source.tokenId,
      fromWalletId: source.wallet.id,
      nativeAmount: sourceNativeAmount, // TODO: Can we just set source nativeamount instead?
      toTokenId: destination.tokenId,
      toWalletId: borrowEngineWallet.id,
      amountFor: 'to'
    })
  } else if (source.wallet.id === borrowEngineWallet.id && source.tokenId !== destination.tokenId) {
    throw new Error('Swapping to repay using a different token from the same wallet not yet supported')

    // TODO: Handle repay with collateral after designing and implementing some way to select a collateral source from AAVE.
  }

  actionOp.actions.push({
    type: 'loan-repay',
    borrowPluginId,
    nativeAmount: destination.nativeAmount,
    walletId: borrowEngineWallet.id,
    tokenId: destination.tokenId
  })

  return actionOp
}

export const makeAaveCloseAction = async ({
  borrowPluginId,
  borrowEngine
}: {
  borrowPluginId: string
  borrowEngine: BorrowEngine
}): Promise<ActionOp | null> => {
  const { currencyWallet: wallet } = borrowEngine

  const collaterals = borrowEngine.collaterals.filter(collateral => !zeroString(collateral.nativeAmount))
  const collateral = collaterals[0]
  const collateralTokenId = collateral?.tokenId

  const debts = borrowEngine.debts.filter(debt => !zeroString(debt.nativeAmount))
  const debt = debts[0]
  const debtTokenId = debt?.tokenId

  const seqAction: SeqActionOp = {
    type: 'seq',
    actions: []
  }

  // Repay actions
  if (debtTokenId != null) {
    seqAction.actions.push({
      type: 'loan-repay',
      nativeAmount: MAX_AMOUNT.toString(),
      borrowPluginId,
      fromTokenId: collateralTokenId,
      tokenId: debtTokenId,
      walletId: wallet.id
    })
  }

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
