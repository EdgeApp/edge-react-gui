import { EdgeAccount } from 'edge-core-js'
import { sprintf } from 'sprintf-js'

import {
  ActionDisplayInfo,
  ActionDisplayStatus,
  ActionEffect,
  ActionOp,
  ActionProgram,
  ActionProgramState,
  LoanDepositActionOp,
  ParActionOp,
  SwapActionOp
} from '../../controllers/action-queue/types'
import { LocaleStringKey } from '../../locales/en_US'
import { lstrings } from '../../locales/strings'
import { queryBorrowPlugins } from '../../plugins/helpers/borrowPluginHelpers'
import { config } from '../../theme/appConfig'
import { getCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { filterNull } from '../../util/safeFilters'
import { LoanBorrowActionOp } from './types'
import { checkEffectIsDone } from './util/checkEffectIsDone'
import { getEffectErrors } from './util/getEffectErrors'

export async function getActionProgramDisplayInfo(account: EdgeAccount, program: ActionProgram, programState: ActionProgramState): Promise<ActionDisplayInfo> {
  // Assume that ActionPrograms always have a NodeActionOp at top level, for purposes of retreiving title and message as the completion strings
  const programType = program.actionOp.type
  if (programType !== 'seq' && programType !== 'par') throw new Error('getActionProgramDisplayInfo only supports NodeActionOps as root program type')

  const displayInfo = await getActionOpDisplayInfo(account, program.actionOp, programState.effect)

  // HACK: Grab the complete message directly from the ActionProgram
  // TODO: To be updated in further redesigns when ActionOp creation is fully handled at ActionProgram creation, instead of in the scenes and utility methods.
  displayInfo.completeMessage = program.completeMessage

  return displayInfo
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
        title: lstrings.action_queue_display_seq_title,
        message: lstrings.action_queue_display_seq_message,
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
      // Override current implementation if custom ActionOpDisplayKey handling is defined
      const { title, message } = await getActionOpDisplayKeyMessage(account, actionOp)

      return {
        title: title ?? lstrings.action_queue_display_par_title,
        message: message ?? lstrings.action_queue_display_par_message,
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
        title: lstrings.action_display_title_swap,
        message: sprintf(
          lstrings.action_queue_display_swap_message,
          fromCurrencyCode,
          config.appName,
          toCurrencyCode,
          lstrings.loan_aave_fragment,
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
        title: sprintf(lstrings.action_queue_display_fiat_buy_title, currencyCode),
        message: sprintf(lstrings.action_queue_display_fiat_buy_message, currencyCode, 'Wyre')
      }
    }
    case 'wyre-sell': {
      const { tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)

      return {
        ...baseDisplayInfo,
        title: lstrings.action_queue_display_fiat_sell_title,
        message: sprintf(lstrings.action_queue_display_fiat_sell_message, currencyCode, 'Wyre')
      }
    }
    case 'loan-borrow': {
      const { tokenId, walletId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)

      return {
        ...baseDisplayInfo,
        title: lstrings.action_queue_display_loan_borrow_title,
        message: sprintf(lstrings.action_queue_display_loan_borrow_message_1s, currencyCode)
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
        title: sprintf(lstrings.action_queue_display_loan_deposit_title, currencyCode),
        message: sprintf(lstrings.action_queue_display_loan_deposit_message, currencyCode, borrowPluginDisplayName)
      }
    }
    case 'loan-repay': {
      if (actionOp.fromTokenId != null) {
        return {
          ...baseDisplayInfo,
          title: lstrings.action_queue_display_loan_repay_with_collateral_title,
          message: lstrings.action_queue_display_loan_repay_with_collateral_message
        }
      } else {
        return {
          ...baseDisplayInfo,
          title: lstrings.action_queue_display_loan_repay_title,
          message: lstrings.action_queue_display_loan_repay_message
        }
      }
    }
    case 'loan-withdraw': {
      const { walletId, tokenId } = actionOp
      const wallet = await account.waitForCurrencyWallet(walletId)
      const { currencyCode } = tokenId != null ? wallet.currencyConfig.allTokens[tokenId] : wallet.currencyInfo

      return {
        ...baseDisplayInfo,
        title: lstrings.action_queue_display_loan_withdraw_title,
        message: sprintf(lstrings.action_queue_display_loan_withdraw_message, currencyCode)
      }
    }
    case 'broadcast-tx': {
      return {
        title: sprintf(lstrings.action_queue_display_unknown_title),
        message: sprintf(lstrings.action_queue_display_unknown_message),
        ...baseDisplayInfo
      }
    }
  }
}

async function getActionOpDisplayKeyMessage(account: EdgeAccount, actionOp: ParActionOp | SwapActionOp): Promise<{ title?: string; message?: string }> {
  let titleData: { stringKey: LocaleStringKey; wildcards?: string[] }
  let messageData: { stringKey: LocaleStringKey; wildcards?: string[] }

  switch (actionOp.displayKey) {
    case 'create':
      {
        // Loan created with sufficient existing fees
        const { actions: parActions } = actionOp
        const depositActionOp = parActions[0] as LoanDepositActionOp

        const { borrowPluginId, tokenId, walletId } = depositActionOp
        const wallet = await account.waitForCurrencyWallet(walletId)
        const collateralCurrencyCode = getCurrencyCode(wallet, tokenId)
        const [borrowPlugin] = queryBorrowPlugins({ borrowPluginId })
        const borrowPluginDisplayName = borrowPlugin.borrowInfo.displayName

        titleData = { stringKey: `action_display_title_create` }
        messageData = { stringKey: `action_display_message_create_3s`, wildcards: [config.appName, borrowPluginDisplayName, collateralCurrencyCode] }
      }
      break
    case 'swap-deposit':
      {
        const { fromWalletId, fromTokenId, toWalletId, toTokenId } = actionOp

        const fromWallet = await account.waitForCurrencyWallet(fromWalletId)
        if (fromWallet == null) throw new Error(`Wallet '${fromWalletId}' not found for fromWalletId`)

        const toWallet = await account.waitForCurrencyWallet(toWalletId)
        if (toWallet == null) throw new Error(`Wallet '${toWalletId}' not found for toWalletId`)

        const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
        const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)

        titleData = { stringKey: `action_display_title_swap` }
        messageData = {
          stringKey: `action_display_message_swap_4s`,
          wildcards: [config.appName, fromCurrencyCode, toCurrencyCode, lstrings.loan_aave_fragment]
        }
      }
      break
    case 'swap-deposit-fees':
      {
        const { actions: parActions } = actionOp
        const { fromWalletId, fromTokenId, toWalletId, toTokenId } = parActions[0] as SwapActionOp

        const fromWallet = await account.waitForCurrencyWallet(fromWalletId)
        if (fromWallet == null) throw new Error(`Wallet '${fromWalletId}' not found for fromWalletId`)

        const toWallet = await account.waitForCurrencyWallet(toWalletId)
        if (toWallet == null) throw new Error(`Wallet '${toWalletId}' not found for toWalletId`)

        const fromCurrencyCode = getCurrencyCode(fromWallet, fromTokenId)
        const toCurrencyCode = getCurrencyCode(toWallet, toTokenId)
        const feeCurrencyCode = getCurrencyCode(toWallet)

        titleData = { stringKey: `action_display_title_swap` }
        messageData = {
          stringKey: `action_display_message_swap_fees_5s`,
          wildcards: [config.appName, fromCurrencyCode, toCurrencyCode, feeCurrencyCode, lstrings.loan_aave_fragment]
        }
      }
      break
    case 'borrow':
      {
        const { actions: parActions } = actionOp
        const { tokenId, walletId } = parActions[0] as LoanBorrowActionOp
        const wallet = await account.waitForCurrencyWallet(walletId)
        const currencyCode = getCurrencyCode(wallet, tokenId)

        titleData = { stringKey: `action_queue_display_loan_borrow_title` }
        messageData = { stringKey: `action_queue_display_loan_borrow_message_1s`, wildcards: [currencyCode] }
      }
      break
    case 'close':
      titleData = { stringKey: `aciton_queue_display_close_title` }
      messageData = { stringKey: `action_queue_display_close_message` }
      break
    default: {
      // Fallback to default display implementation
      return { title: undefined, message: undefined }
    }
  }

  // Retrieve the strings. Populate wildcards, if applicable
  return {
    title: titleData.wildcards == null ? lstrings[titleData.stringKey] : sprintf(lstrings[titleData.stringKey], ...titleData.wildcards),
    message: messageData.wildcards == null ? lstrings[messageData.stringKey] : sprintf(lstrings[messageData.stringKey], ...messageData.wildcards)
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
