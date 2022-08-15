// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js/types'

import { getToken } from '../../components/scenes/Loans/LoanDetailsScene'
import { enableToken } from '../../util/CurrencyWalletHelpers'
import { type ActionOp, type ActionProgram } from './types'

// -----------------------------------------------------------------------------
//  Given the user inputs made in the AAVE UI, return the Actions needed to
//  create the ActionProgram.
// -----------------------------------------------------------------------------

export const makeAaveBorrowAction = async ({
  borrowEngineWallet,
  borrowPluginId,
  borrowTokenId,
  nativeAmount
}: {
  borrowEngineWallet: EdgeCurrencyWallet,
  borrowPluginId: string,
  borrowTokenId?: string,
  nativeAmount: string
}): Promise<ActionOp[]> => {
  const out = []
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
  borrowEngineWallet: EdgeCurrencyWallet,
  borrowPluginId: string,
  depositTokenId?: string,
  nativeAmount: string,
  srcTokenId?: string,
  srcWallet: EdgeCurrencyWallet
}): Promise<ActionOp[]> => {
  const out = []
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

export const makeAaveRepayAction = async (borrowPluginId: string, nativeAmount: string, tokenId: string, wallet: EdgeCurrencyWallet) => {
  // TODO: update props + add logic to decide whether to swap, if the scene allows for such a use case.
  return {
    type: 'loan-repay',
    borrowPluginId,
    nativeAmount,
    tokenId,
    walletId: wallet.id
  }
}

export const makeAaveWithdrawAction = async (borrowPluginId: string, nativeAmount: string, tokenId: string, wallet: EdgeCurrencyWallet) => {
  enableToken(tokenId, wallet)
  return {
    type: 'loan-withdraw',
    borrowPluginId,
    nativeAmount,
    tokenId,
    walletId: wallet.id
  }
}

export async function makeActionProgram(actionOp: ActionOp, id?: string): Promise<ActionProgram> {
  const programId = Date.now().toString() + (id ?? '')

  return {
    programId,
    actionOp
  }
}
