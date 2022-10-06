import { EdgeCurrencyWallet } from 'edge-core-js/types'

import { ActionOp } from '../controllers/action-queue/types'
import { getToken } from './CurrencyInfoHelpers'
import { enableToken } from './CurrencyWalletHelpers'

// -----------------------------------------------------------------------------
//  Given the user inputs made in the AAVE UI, return the Actions needed to
//  create the ActionProgram.
// -----------------------------------------------------------------------------

export const makeAaveBorrowAction = async ({
  borrowEngineWallet,
  borrowPluginId,
  borrowTokenId,
  destBankId,
  nativeAmount
}: {
  borrowEngineWallet: EdgeCurrencyWallet
  borrowPluginId: string
  borrowTokenId?: string
  destBankId?: string
  nativeAmount: string
}): Promise<ActionOp[]> => {
  const out: ActionOp[] = []
  const borrowToken = getToken(borrowEngineWallet, borrowTokenId)

  // If no borrow token specified (withdraw to bank), default to USDC for intermediate borrow step prior to withdrawing to bank
  const borrowTokenCc = borrowToken == null ? 'USDC' : borrowToken.currencyCode
  await enableToken(borrowTokenCc, borrowEngineWallet)
  const allTokens = borrowEngineWallet.currencyConfig.allTokens
  const defaultTokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === borrowTokenCc)
  if (defaultTokenId == null) throw new Error(`Could not find default token ${borrowTokenCc} for borrow request`)

  // TODO: ASSUMPTION: The only borrow destinations are:
  // 1. USDC
  // 2. Bank (sell/fiat off-ramp), to be handled in a separate method
  if (borrowTokenCc !== 'USDC') throw new Error('Non-USDC token borrowing not yet implemented') // Should not happen...

  // Construct the borrow action
  if (borrowTokenId != null || defaultTokenId != null)
    out.push({
      type: 'loan-borrow',
      borrowPluginId,
      nativeAmount,
      tokenId: borrowTokenId ?? defaultTokenId,
      walletId: borrowEngineWallet.id
    })

  // Construct the Withdraw to Bank action
  if (destBankId != null) {
    out.push({
      type: 'wyre-sell',
      wyreAccountId: destBankId,
      nativeAmount,
      tokenId: borrowTokenId ?? defaultTokenId,
      walletId: borrowEngineWallet.id
    })
  }

  return out
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
}): Promise<ActionOp[]> => {
  const out: ActionOp[] = []
  // TODO: Handle buy from fiat onramp in a separate method

  const depositToken = getToken(borrowEngineWallet, depositTokenId)

  // If no deposit token provided (i.e. buy from exchange provider), default to WBTC
  const depositTokenCc = depositToken == null ? 'WBTC' : depositToken.currencyCode
  await enableToken(depositTokenCc, borrowEngineWallet)
  const allTokens = borrowEngineWallet.currencyConfig.allTokens
  const tokenId = depositTokenId ?? Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === 'WBTC')

  // If deposit source wallet is not the borrowEngineWallet, swap first into the borrow engine wallet + deposit token before depositing.
  if (srcWallet.id !== borrowEngineWallet.id) {
    out.push({
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
  out.push({
    type: 'loan-deposit',
    borrowPluginId,
    nativeAmount,
    tokenId,
    walletId: borrowEngineWallet.id
  })

  return out
}

export const makeAaveRepayAction = async (borrowPluginId: string, nativeAmount: string, tokenId: string, wallet: EdgeCurrencyWallet): Promise<ActionOp> => {
  // TODO: Spec out behavior for potentially repaying with a different asset.
  const repayToken = getToken(wallet, tokenId)
  if (repayToken == null) throw new Error(`Could not find repayment token ${tokenId} on ${wallet.currencyInfo.currencyCode} wallet`)
  await enableToken(repayToken.currencyCode, wallet)
  return {
    type: 'loan-repay',
    borrowPluginId,
    nativeAmount,
    tokenId,
    walletId: wallet.id
  }
}

export const makeAaveWithdrawAction = async (borrowPluginId: string, nativeAmount: string, tokenId: string, wallet: EdgeCurrencyWallet): Promise<ActionOp> => {
  const withdrawalToken = getToken(wallet, tokenId)
  if (withdrawalToken == null) throw new Error(`Could not find withdrawal token ${tokenId} on ${wallet.currencyInfo.currencyCode} wallet`)
  await enableToken(withdrawalToken.currencyCode, wallet)
  return {
    type: 'loan-withdraw',
    borrowPluginId,
    nativeAmount,
    tokenId,
    walletId: wallet.id
  }
}
