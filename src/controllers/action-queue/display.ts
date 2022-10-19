import { EdgeAccount } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import { ActionDisplayInfo, ActionDisplayStatus, ActionEffect, ActionOp, ActionProgram, ActionProgramState } from '../../controllers/action-queue/types'
import s from '../../locales/strings'
import { queryBorrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { config } from '../../theme/appConfig'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { filterNull } from '../../util/safeFilters'
import { checkEffectIsDone } from './util/checkEffectIsDone'
import { getEffectErrors } from './util/getEffectErrors'

export async function getActionProgramDisplayInfo(account: EdgeAccount, program: ActionProgram, programState: ActionProgramState): Promise<ActionDisplayInfo> {
  return await getActionOpDisplayInfo(account, program.actionOp, programState.effect)
}

async function getActionOpDisplayInfo(account: EdgeAccount, actionOp: ActionOp, effect?: ActionEffect): Promise<ActionDisplayInfo> {
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexpected null effect while generating display info. ` + `This could be caused by a dryrun effect leaking into program state when it shouldn't.`

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
            let childEffect: ActionEffect | undefined
            // If there is no effect, then this mean the program hasn't started
            if (effect != null) {
              // If the sequence effect is done without an error, then the
              // sequence has completed successfully, and all the child effects
              // would be complete too.
              if (checkEffectIsDone(effect) && getEffectErrors(effect).length === 0) {
                childEffect = effect
              }
              // Otherwise the effect should be a seq matching the seq actionOp:
              if (effect.type === 'seq') {
                const checkedEffects = filterNull(effect.childEffects)
                if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)
                // Use the opIndex on the effect to determine which child ops are
                // done and which one inherits the pending effect
                if (index < effect.opIndex) childEffect = { type: 'done' }
                if (index === effect.opIndex) childEffect = checkedEffects[effect.opIndex]
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
            let childEffect: ActionEffect | undefined
            // If there is no effect, then this mean the program hasn't started
            if (effect != null) {
              // If the sequence effect is done without an error, then the
              // sequence has completed successfully, and all the child effects
              // would be complete too.
              if (checkEffectIsDone(effect) && getEffectErrors(effect).length === 0) {
                childEffect = effect
              }
              // Otherwise the effect should be a seq matching the seq actionOp:
              if (effect.type === 'par') {
                const currentChildEffect: ActionEffect | null = effect.childEffects[index]
                if (currentChildEffect === null) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)
                childEffect = currentChildEffect
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
        message: sprintf(
          s.strings.action_queue_display_swap_message,
          fromCurrencyCode,
          config.appName,
          toCurrencyCode,
          s.strings.loan_aave_fragment,
          toWallet.currencyInfo.currencyCode
        )
      }
    }
    case 'wyre-buy': {
      const { tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)

      return {
        ...baseDisplayInfo,
        title: sprintf(s.strings.action_queue_display_fiat_buy_title, currencyCode),
        message: sprintf(s.strings.action_queue_display_fiat_buy_message, currencyCode, 'Wyre')
      }
    }
    case 'wyre-sell': {
      const { tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)

      return {
        ...baseDisplayInfo,
        title: s.strings.action_queue_display_fiat_sell_title,
        message: sprintf(s.strings.action_queue_display_fiat_sell_message, currencyCode, 'Wyre')
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
      if (actionOp.fromTokenId != null) {
        return {
          ...baseDisplayInfo,
          title: s.strings.action_queue_display_loan_repay_with_collateral_title,
          message: s.strings.action_queue_display_loan_repay_with_collateral_message
        }
      } else {
        return {
          ...baseDisplayInfo,
          title: s.strings.action_queue_display_loan_repay_title,
          message: s.strings.action_queue_display_loan_repay_message
        }
      }
    }
    case 'loan-withdraw': {
      const { walletId, tokenId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const { currencyCode } = tokenId != null ? wallet.currencyConfig.allTokens[tokenId] : wallet.currencyInfo

      return {
        ...baseDisplayInfo,
        title: s.strings.action_queue_display_loan_withdraw_title,
        message: sprintf(s.strings.action_queue_display_loan_withdraw_message, currencyCode)
      }
    }
    case 'broadcast-tx': {
      return {
        title: sprintf(s.strings.action_queue_display_unknown_title),
        message: sprintf(s.strings.action_queue_display_unknown_message),
        ...baseDisplayInfo
      }
    }
  }
}

// This op is only done if the effect is a 'done' because the runtime
// should return a 'done' after the last effect passes in sequence or parallel (seq/par).
function stateToStatus(effect?: ActionEffect): ActionDisplayStatus {
  if (effect == null) return 'pending'
  if (checkEffectIsDone(effect)) {
    const errors = getEffectErrors(effect)
    if (errors.length > 0) return errors[0]
    return 'done'
  }
  return 'active'
}
