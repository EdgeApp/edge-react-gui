import { div, log10 } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { showButtonsModal } from '../../../components/modals/ButtonsModal'
import { lstrings } from '../../../locales/strings'
import { getExchangeDenom } from '../../../selectors/DenominationSelectors'

/**
 * Opens the wallet's trustline for a Stellar token, so the anchor can pay
 * the token into it. The same wallet pays the fee in XLM after the user
 * agrees to it. Returns false if the user declines.
 */
export async function activateTokenForDeposit(
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet,
  tokenId: string
): Promise<boolean> {
  if (!wallet.unactivatedTokenIds.includes(tokenId)) return true

  const quote = await account.activateWallet({
    activateWalletId: wallet.id,
    activateTokenIds: [tokenId],
    paymentInfo: { walletId: wallet.id, tokenId: null }
  })

  const { nativeAmount, tokenId: feeTokenId } = quote.networkFee
  const feeDenom = getExchangeDenom(wallet.currencyConfig, feeTokenId)
  const fee = div(nativeAmount, feeDenom.multiplier, log10(feeDenom.multiplier))
  const currencyCode =
    wallet.currencyConfig.allTokens[tokenId]?.currencyCode ?? tokenId

  const answer = await showButtonsModal({
    title: lstrings.activate_wallet_token_scene_title,
    message: sprintf(
      lstrings.moneygram_activate_message_2s,
      currencyCode,
      `${fee} ${feeDenom.name}`
    ),
    buttons: {
      activate: { label: lstrings.moneygram_activate_button },
      cancel: { label: lstrings.string_cancel_cap }
    }
  })
  if (answer !== 'activate') {
    await quote.close()
    return false
  }

  // The engine resolves once the ledger holds the trustline:
  try {
    await quote.approve({
      metadata: {
        name: lstrings.activate_wallet_token_transaction_name_category_generic,
        category: `Expense:${lstrings.activate_wallet_token_transaction_name_category_generic}`,
        notes: lstrings.activate_wallet_token_transaction_notes_generic
      }
    })
  } catch (error: unknown) {
    await quote.close().catch(() => {})
    throw error
  }
  return true
}
