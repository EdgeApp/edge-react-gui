/**
 * What a transaction should be called.
 *
 * A pure function of the transaction, the wallet and the account: the
 * category, the payee, the direction, and the label for each action type.
 * Extracted from `CategoriesActions.ts` so the GUI and a Node caller derive
 * the same answer rather than approximately the same answer.
 */
import { eq } from 'biggystring'
import type {
  EdgeAccount,
  EdgeAssetAction,
  EdgeAssetAmount,
  EdgeCurrencyWallet,
  EdgeMetadata,
  EdgeTransaction,
  EdgeTxAction
} from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { cleanFiatCurrencyCode } from '../fiatCode'
import { reportWarning } from '../reportWarning'
import { type EdgeCategory, joinCategory } from './category'
import { getCurrencyCodeWithAccount } from './currencyCodes'
import { txActionLabel } from './txActionLabels'

/**
 * What `getTxActionDisplayInfo` works out about one transaction.
 *
 * `userData` is what the user wrote, `savedData` what the action implies, and
 * `mergedData` the two combined with the user's values winning.
 */
export interface ActionDisplayInfo {
  direction: 'send' | 'receive'
  iconPluginId?: string
  userData: EdgeMetadata
  savedData: EdgeMetadata
  mergedData: EdgeMetadata
  action?: EdgeTxAction
  assetAction?: EdgeAssetAction
}

/**
 * Overlay GUI-computed display name/category/notes onto `tx.metadata` for
 * API responses. Does not persist. Keeps existing exchangeAmount and other
 * fields that `getTxActionDisplayInfo` does not own.
 */
export const fillTxMetadataForDisplay = (
  tx: EdgeTransaction,
  mergedData: EdgeMetadata
): EdgeTransaction => ({
  ...tx,
  metadata: {
    ...tx.metadata,
    name: mergedData.name,
    category: mergedData.category,
    notes: mergedData.notes
  }
})

/**
 * Given a transaction's `EdgeTxAction`, derive the values that pre-fill the
 * Category and Notes tiles — unless the user has already edited them, in which
 * case `mergedData` keeps what they wrote.
 */
export const getTxActionDisplayInfo = (
  tx: EdgeTransaction,
  account: EdgeAccount,
  wallet: EdgeCurrencyWallet
): ActionDisplayInfo => {
  const {
    assetAction,
    chainAction,
    chainAssetAction,
    metadata,
    savedAction,
    swapData,
    tokenId
  } = tx
  const { currencyConfig, currencyInfo } = wallet

  const displayName =
    tokenId == null
      ? currencyInfo.assetDisplayName
      : currencyConfig.allTokens[tokenId]?.displayName ?? ''

  const action = savedAction ?? chainAction
  const assetAct = assetAction ?? chainAssetAction

  const getCurrencyCodes = (assets: EdgeAssetAmount[]): string[] =>
    assets
      .map(asset =>
        getCurrencyCodeWithAccount(account, asset.pluginId, asset.tokenId)
      )
      .filter((currencyCode): currencyCode is string => currencyCode != null)

  const isSentTransaction =
    tx.nativeAmount.startsWith('-') || (eq(tx.nativeAmount, '0') && tx.isSend)

  let payeeText: string | undefined
  let edgeCategory: EdgeCategory
  let direction: 'send' | 'receive'
  let notes: string | undefined
  let iconPluginId: string | undefined

  // Default text for send or receive
  if (isSentTransaction) {
    payeeText = sprintf(lstrings.transaction_sent_1s, displayName)
    direction = 'send'
    edgeCategory = {
      category: 'expense',
      subcategory: ''
    }
  } else {
    payeeText = sprintf(lstrings.transaction_received_1s, displayName)
    direction = 'receive'
    edgeCategory = {
      category: 'income',
      subcategory: ''
    }
  }

  // Override with swapData
  if (swapData != null) {
    const { payoutCurrencyCode } = swapData
    payeeText = sprintf(
      lstrings.transaction_details_swap_to_subcat_1s,
      payoutCurrencyCode
    )
  }

  if (action != null && assetAct != null) {
    const { actionType } = action
    const { assetActionType } = assetAct
    payeeText = txActionLabel(assetActionType)

    let unsupported = false

    switch (actionType) {
      case 'swap': {
        iconPluginId = action.swapInfo.pluginId
        switch (assetActionType) {
          case 'transfer': {
            const txSrc = action.payoutWalletId !== wallet.id
            const toFromStr = txSrc
              ? lstrings.transaction_details_swap_to_subcat_1s
              : lstrings.transaction_details_swap_from_subcat_1s
            const walletName =
              account.currencyWallets[action.payoutWalletId]?.name ??
              displayName
            edgeCategory = {
              category: 'transfer',
              subcategory: sprintf(toFromStr, walletName)
            }
            break
          }
          case 'transferNetworkFee':
          case 'swapNetworkFee': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            break
          }
          case 'swap':
          case 'swapOrderFill': {
            // Determine if the swap destination was to a different asset or if the
            // swap source was from a different asset.
            const txSrcSameAsset =
              action.fromAsset.tokenId === tokenId &&
              action.fromAsset.pluginId === wallet.currencyInfo.pluginId
            const toFromStr = txSrcSameAsset
              ? lstrings.transaction_details_swap_to_subcat_1s
              : lstrings.transaction_details_swap_from_subcat_1s
            const otherAsset = txSrcSameAsset
              ? action.toAsset
              : action.fromAsset

            edgeCategory = {
              category: 'exchange',
              subcategory: sprintf(
                toFromStr,
                getCurrencyCodeWithAccount(
                  account,
                  otherAsset.pluginId,
                  otherAsset.tokenId
                )
              )
            }
            direction = txSrcSameAsset ? 'send' : 'receive'
            break
          }

          case 'swapOrderPost': {
            edgeCategory = {
              category: 'expense',
              subcategory: sprintf(lstrings.transaction_details_swap_order_post)
            }
            direction = 'send'
            break
          }
          case 'swapOrderCancel': {
            edgeCategory = {
              category: 'expense',
              subcategory: sprintf(
                lstrings.transaction_details_swap_order_cancel
              )
            }
            direction = 'send'
            break
          }
          default:
            unsupported = true
        }
        break
      }
      case 'stake': {
        iconPluginId = action.pluginId
        switch (assetActionType) {
          case 'stake': {
            let subcategory
            if (action.stakeAssets.length === 1)
              subcategory = sprintf(
                lstrings.transaction_details_stake_subcat_1s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else if (action.stakeAssets.length === 2)
              subcategory = sprintf(
                lstrings.transaction_details_stake_subcat_2s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else {
              reportWarning(
                `Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`
              )
              break
            }
            edgeCategory = { category: 'transfer', subcategory }
            direction = 'send'
            break
          }
          case 'stakeOrder': {
            if (action.stakeAssets.length === 1)
              notes = sprintf(
                lstrings.transaction_details_unstake_order_notes_1s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else if (action.stakeAssets.length === 2)
              notes = sprintf(
                lstrings.transaction_details_unstake_order_notes_2s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else {
              reportWarning(
                `Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`
              )
              break
            }

            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.transaction_details_stake_order_subcat
            }
            direction = 'send'
            break
          }
          case 'claim': {
            let subcategory
            if (action.stakeAssets.length === 1)
              subcategory = sprintf(
                lstrings.transaction_details_unstake_subcat_1s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else if (action.stakeAssets.length === 2)
              subcategory = sprintf(
                lstrings.transaction_details_unstake_subcat_2s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else {
              reportWarning(
                `Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`
              )
              break
            }
            edgeCategory = { category: 'transfer', subcategory }
            if (
              action.stakeAssets.every(
                asset => asset.pluginId === currencyInfo.pluginId
              )
            ) {
              direction = 'receive'
            } else {
              direction = 'send'
            }
            break
          }
          case 'unstake': {
            let subcategory
            if (action.stakeAssets.length === 1)
              subcategory = sprintf(
                lstrings.transaction_details_unstake_subcat_1s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else if (action.stakeAssets.length === 2)
              subcategory = sprintf(
                lstrings.transaction_details_unstake_subcat_2s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else {
              reportWarning(
                `Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`
              )
              break
            }
            edgeCategory = { category: 'transfer', subcategory }
            direction = 'receive'
            break
          }
          case 'claimOrder':
          case 'unstakeOrder': {
            if (action.stakeAssets.length === 1)
              notes = sprintf(
                lstrings.transaction_details_unstake_order_notes_1s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else if (action.stakeAssets.length === 2)
              notes = sprintf(
                lstrings.transaction_details_unstake_order_notes_2s,
                ...getCurrencyCodes(action.stakeAssets)
              )
            else {
              reportWarning(
                `Unsupported number of assets for '${assetActionType}' EdgeTxActionSwapType`
              )
              break
            }

            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.transaction_details_unstake_order
            }
            direction = 'send'
            break
          }
          case 'unstakeNetworkFee':
          case 'stakeNetworkFee': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            break
          }

          default:
            unsupported = true
        }
        break
      }
      case 'fiat': {
        iconPluginId = action.fiatPlugin.providerId
        switch (assetActionType) {
          case 'buy': {
            payeeText = sprintf(payeeText, displayName)
            const { fiatAsset } = action
            const { fiatCurrencyCode } = cleanFiatCurrencyCode(
              fiatAsset.fiatCurrencyCode
            )
            edgeCategory = {
              category: 'exchange',
              subcategory: sprintf(
                lstrings.transaction_details_swap_from_subcat_1s,
                fiatCurrencyCode
              )
            }
            direction = 'receive'
            break
          }
          case 'sell': {
            payeeText = sprintf(payeeText, displayName)
            const { fiatAsset } = action
            const { fiatCurrencyCode } = cleanFiatCurrencyCode(
              fiatAsset.fiatCurrencyCode
            )
            edgeCategory = {
              category: 'exchange',
              subcategory: sprintf(
                lstrings.transaction_details_swap_to_subcat_1s,
                fiatCurrencyCode
              )
            }
            direction = 'send'
            break
          }
          case 'sellNetworkFee': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            direction = 'send'
            break
          }
          default:
            unsupported = true
        }
        break
      }
      // `swapSend`, from the swap-and-send flows. Its own outer arm because
      // the three titles are what tell them apart in a list, and a private
      // one names no recipient at all.
      case 'swapSend': {
        iconPluginId = action.swapInfo.pluginId
        switch (assetActionType) {
          case 'transferNetworkFee':
          case 'swapNetworkFee': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            break
          }
          default: {
            // A send is titled by the flow the user ran, so the three are
            // distinguishable in the list. The private flavors name no
            // recipient; the payout address stays on the action for support.
            const { fromAsset, toAsset } = action
            const sameAsset =
              fromAsset.pluginId === toAsset.pluginId &&
              fromAsset.tokenId === toAsset.tokenId
            payeeText = !action.privacy
              ? lstrings.transaction_details_swap_and_send
              : sameAsset
              ? lstrings.transaction_details_stealth_send
              : lstrings.transaction_details_stealth_swap_and_send
            edgeCategory = {
              category: 'exchange',
              subcategory: sprintf(
                lstrings.transaction_details_swap_to_subcat_1s,
                getCurrencyCodeWithAccount(
                  account,
                  toAsset.pluginId,
                  toAsset.tokenId
                )
              )
            }
            direction = 'send'
          }
        }
        break
      }
      case 'tokenApproval': {
        switch (assetActionType) {
          case 'tokenApproval': {
            edgeCategory = {
              category: 'expense',
              subcategory: lstrings.wc_smartcontract_network_fee
            }
            break
          }
          default:
            unsupported = true
        }
        break
      }
      case 'giftCard': {
        iconPluginId = action.provider.providerId
        payeeText = lstrings.gift_card_recipient_name
        edgeCategory = {
          category: 'expense',
          subcategory: action.card.name
        }
        direction = 'send'
        break
      }
      default:
        unsupported = true
    }

    if (unsupported)
      reportWarning(
        `Unsupported EdgeTxAction assetAction:assetActionType '${assetActionType}'`
      )
  }
  const savedData: EdgeMetadata = {
    name: payeeText,
    category: joinCategory(edgeCategory),
    notes
  }

  // A private send exists to keep the recipient off the screen, so its title
  // outranks any stored name: a recipient-style name reaching the transaction
  // by any route would otherwise display exactly what the flow conceals.
  const isPrivateSend = action?.actionType === 'swapSend' && action.privacy

  const mergedData: EdgeMetadata = {
    name:
      !isPrivateSend && metadata?.name != null && metadata.name.length > 0
        ? metadata.name
        : savedData.name,
    category:
      metadata?.category != null && metadata.category.length > 0
        ? metadata.category
        : savedData.category,
    notes:
      metadata?.notes != null && metadata.notes.length > 0
        ? metadata.notes
        : savedData.notes
  }

  return {
    action,
    assetAction,
    direction,
    iconPluginId,
    savedData,
    userData: metadata ?? {},
    mergedData
  }
}
