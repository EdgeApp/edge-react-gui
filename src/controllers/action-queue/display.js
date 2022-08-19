// @flow
import { div } from 'biggystring'
import { type EdgeAccount } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import {
  type ActionDisplayInfo,
  type ActionEffect,
  type ActionOp,
  type ActionOpExecStatus,
  type ActionProgram,
  type ActionProgramState
} from '../../controllers/action-queue/types'
import s from '../../locales/strings'
import { queryBorrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'

export async function getActionProgramDisplayInfo(account: EdgeAccount, program: ActionProgram, programState: ActionProgramState): Promise<ActionDisplayInfo> {
  return await getActionOpDisplayInfo(account, program.actionOp, programState.effect)
}

async function getActionOpDisplayInfo(account: EdgeAccount, actionOp: ActionOp, effect?: ActionEffect): Promise<ActionDisplayInfo> {
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexepected null effect while generating display info. ` + `This could be caused by a dryrun effect leaking into program state when it shouldn't.`

  const baseDisplayInfo = {
    status: stateToStatus(effect),
    steps: []
  }

  switch (actionOp.type) {
    case 'seq': {
      return {
        title: s.strings.action_queue_display_seq_title,
        message: s.strings.action_queue_display_seq_message,
        ...baseDisplayInfo,
        steps: await Promise.all(
          actionOp.actions.map(async (op, index) => {
            let childEffect: ActionEffect | void
            // If there is no effect, then this mean the program hasn't started
            if (effect != null) {
              // If the sequence effect is done without an error, then the
              // sequence has completed successfully, and all the child effects
              // would be complete too.
              if (effect.type === 'done' && effect.error != null) {
                childEffect = effect
              }
              // Otherwise the effect should be a seq matching the seq actionOp:
              if (effect.type === 'seq') {
                if (effect.childEffect === null) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)
                // Use the opIndex on the effect to determine which child ops are
                // done and which one inherits the pending effect
                if (index < effect.opIndex) childEffect = { type: 'done' }
                if (index === effect.opIndex) childEffect = effect.childEffect
              }
            }

            return await getActionOpDisplayInfo(account, op, childEffect)
          })
        )
      }
    }
    case 'par': {
      return {
        title: s.strings.action_queue_display_par_title,
        message: s.strings.action_queue_display_par_message,
        ...baseDisplayInfo,
        steps: await Promise.all(
          actionOp.actions.map(async (op, index) => {
            let childEffect: ActionEffect | void
            // If there is no effect, then this mean the program hasn't started
            if (effect != null) {
              // If the sequence effect is done without an error, then the
              // sequence has completed successfully, and all the child effects
              // would be complete too.
              if (effect.type === 'done' && effect.error != null) {
                childEffect = effect
              }
              // Otherwise the effect should be a seq matching the seq actionOp:
              if (effect.type === 'par') {
                if (effect.childEffects[index] === null) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)
                childEffect = effect.childEffects[index]
              }
            }

            return await getActionOpDisplayInfo(account, op, childEffect)
          })
        )
      }
    }
    case 'swap': {
      const { fromWalletId, fromTokenId, toWalletId, toTokenId } = actionOp

      const fromWallet = await account.waitForCurrencyWallet(fromWalletId)
      if (fromWallet == null) throw new Error(`Wallet '${fromWalletId}' not found for fromWalletId`)

      const toWallet = await account.waitForCurrencyWallet(toWalletId)
      if (toWallet == null) throw new Error(`Wallet '${toWalletId}' not found for toWalletId`)

      const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
      const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

      return {
        ...baseDisplayInfo,
        title: sprintf(s.strings.action_queue_display_swap_title, fromCurrencyCode, toCurrencyCode),
        message: sprintf(s.strings.action_queue_display_swap_message, fromCurrencyCode, toCurrencyCode)
      }
    }
    case 'exchange-buy': {
      const { exchangePluginId, tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)
      // TODO: Convert exchangePluginId to displayName
      const partnerDisplayName = exchangePluginId

      return {
        ...baseDisplayInfo,
        title: sprintf(s.strings.action_queue_display_exchange_buy_title, currencyCode),
        message: sprintf(s.strings.action_queue_display_exchange_buy_message, currencyCode, partnerDisplayName)
      }
    }
    case 'exchange-sell': {
      const { exchangePluginId, tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)
      // TODO: Convert exchangePluginId to displayName
      const partnerDisplayName = exchangePluginId

      return {
        ...baseDisplayInfo,
        title: s.strings.action_queue_display_exchange_sell_title,
        message: sprintf(s.strings.action_queue_display_exchange_sell_message, currencyCode, partnerDisplayName)
      }
    }
    case 'loan-borrow': {
      const { tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)

      return {
        ...baseDisplayInfo,
        title: s.strings.action_queue_display_loan_borrow_title,
        message: sprintf(s.strings.action_queue_display_loan_borrow_message, currencyCode)
      }
    }
    case 'loan-deposit': {
      const { borrowPluginId, tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)
      const [borrowPlugin] = queryBorrowPlugins({ borrowPluginId })
      const borrowPluginDisplayName = borrowPlugin.borrowInfo.displayName

      return {
        ...baseDisplayInfo,
        title: sprintf(s.strings.action_queue_display_loan_deposit_title, currencyCode),
        message: sprintf(s.strings.action_queue_display_loan_deposit_message, currencyCode, borrowPluginDisplayName)
      }
    }
    case 'loan-repay': {
      return {
        ...baseDisplayInfo,
        title: s.strings.action_queue_display_loan_repay_title,
        message: sprintf(s.strings.action_queue_display_loan_repay_message)
      }
    }
    case 'loan-withdraw': {
      const { nativeAmount, walletId, tokenId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const { currencyCode, denominations } = tokenId != null ? wallet.currencyConfig.allTokens[tokenId] : wallet.currencyInfo
      const { multiplier } = denominations[0]
      const amount = div(nativeAmount, multiplier, multiplier.length)
      const displayAmount = `${amount} ${currencyCode}`
      return {
        ...baseDisplayInfo,
        title: s.strings.action_queue_display_loan_withdraw_title,
        message: sprintf(s.strings.action_queue_display_loan_withdraw_message, displayAmount)
      }
    }
    case 'toast': {
      return {
        title: s.strings.action_queue_display_toast_title,
        message: s.strings.action_queue_display_toast_message,
        ...baseDisplayInfo
      }
    }
    case 'delay': {
      const { ms } = actionOp

      if (effect == null || effect.type !== 'unixtime') {
        return {
          title: s.strings.action_queue_display_delay_title,
          message: sprintf(s.strings.action_queue_display_delay_message_pending, ms),
          ...baseDisplayInfo
        }
      }

      const timestamp = effect.timestamp
      const moment = new Date(timestamp).toUTCString()

      return {
        title: s.strings.action_queue_display_delay_title,
        message: sprintf(s.strings.action_queue_display_delay_message_doing, moment),
        ...baseDisplayInfo
      }
    }
    default:
      return {
        title: sprintf(s.strings.action_queue_display_unknown_title),
        message: sprintf(s.strings.action_queue_display_unknown_message),
        ...baseDisplayInfo
      }
  }
}

// This op is only done if the effect is a 'done' type because the runtime
// should return a 'done' type after the last effect passes in sequence or parallel (seq/par).
function stateToStatus(effect?: ActionEffect): ActionOpExecStatus {
  if (effect == null) return 'pending'
  if (effect.type === 'done') return effect.error ?? 'done'
  return 'active'
}
