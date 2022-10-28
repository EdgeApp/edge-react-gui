import { gte, lte } from 'biggystring'

import { getCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { filterNull } from '../../../util/safeFilters'
import { checkPushEvent } from '../push'
import { ActionEffect, EffectCheckResult, ExecutionContext, SeqEffect } from '../types'

/**
 * Check whether an ActionEffect is observed as effective (completed).
 *
 * @param context Execution context for the action queue (same param as evaluateAction)
 * @param effect The effect to check for effectiveness (completed)
 * @returns `EffectCheckResult` object containing:
 * 1. `isEffective`: boolean indicating whether the effect is effective.
 *     Partially complete effects are not effective and so the boolean must be false.
 * 2. `delay`: in milliseconds to let the caller know how long to delay the
 *    `nextExecutionTime`.
 * 3. `updatedEffect`: for if the effect is partially effective.
 *
 * ### Partially Completed Effects
 *
 * SeqEffect introduced the concept of a "partially completed effect" in
 * order to support tracking the progress of precomputed effects which are
 * delegated to an external execution environment (e.g. push-server).
 * A SeqEffect is partially-completed when it's opIndex is less then the last
 * index of it's childEffects.
 */
export async function checkActionEffect(context: ExecutionContext, effect: ActionEffect): Promise<EffectCheckResult> {
  const { account } = context
  const UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE =
    `Unexpected null effect while running check. ` + `This could be caused by a dryrun effect leaking into program state when it shouldn't.`

  switch (effect.type) {
    case 'seq': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Only check the child effect at the current opIndex
      const childEffect = checkedEffects[effect.opIndex]
      const childEffectCheck = await context.checkActionEffect(childEffect)

      // Completely effective
      if (childEffectCheck.isEffective && effect.opIndex >= effect.childEffects.length - 1) {
        return {
          delay: 0,
          isEffective: true
        }
      }

      // Partially effective
      if (childEffectCheck.isEffective) {
        // Progress the partially completed effect forward
        const updatedEffect: SeqEffect = {
          ...effect,
          opIndex: effect.opIndex + 1
        }
        return {
          delay: 0,
          isEffective: false,
          updatedEffect
        }
      }

      // Ineffective
      return {
        delay: childEffectCheck.delay,
        isEffective: false
      }
    }
    case 'par': {
      const checkedEffects = filterNull(effect.childEffects)
      if (checkedEffects.length !== effect.childEffects.length) throw new Error(UNEXPECTED_NULL_EFFECT_ERROR_MESSAGE)

      // Check all child effects concurrently
      const childEffectPromises = checkedEffects.map(async childEffect => {
        return await context.checkActionEffect(childEffect)
      })
      const childEffectChecks = await Promise.all(childEffectPromises)
      const isEffective = childEffectChecks.every(result => result.isEffective)

      // Include an updated effect if partially completed
      const updatedEffect: ActionEffect | undefined = !isEffective
        ? {
            type: 'par',
            childEffects: checkedEffects.map((effect, index) => {
              return childEffectChecks[index].isEffective ? { type: 'done' } : effect
            })
          }
        : undefined

      // Let delay be the maximum delay of the remaining ineffective effects or zero
      const delay = childEffectChecks.reduce((max, result) => (result.isEffective ? max : Math.max(result.delay, max)), 0)

      return {
        delay,
        isEffective,
        updatedEffect
      }
    }
    case 'address-balance': {
      // TODO: Use effect.address when we can check address balances
      const { aboveAmount, belowAmount, tokenId, walletId } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)
      const currencyCode = getCurrencyCode(wallet, tokenId)
      const walletBalance = wallet.balances[currencyCode] ?? '0'

      return {
        delay: 15000,
        isEffective: (aboveAmount != null && gte(walletBalance, aboveAmount)) || (belowAmount != null && lte(walletBalance, belowAmount))
      }
    }
    case 'push-event': {
      const { eventId } = effect

      return {
        delay: 15000,
        isEffective: await checkPushEvent(context, eventId)
      }
    }
    case 'price-level': {
      // TODO: Implement
      throw new Error('No implementation for price effect')
    }
    case 'tx-confs': {
      const { txId, walletId, confirmations } = effect
      const wallet = await account.waitForCurrencyWallet(walletId)

      // Get transaction
      const txs = await wallet.getTransactions({
        // TODO: Add a parameter to limit to one transaction in result
        searchString: txId
      })

      // If not transaction is found with the effect's txId, then we can assume
      // that we're waiting to synchronize with network state.
      if (txs.length === 0) {
        return {
          delay: 6000,
          isEffective: false
        }
      }

      const tx = txs[0]

      if (tx.confirmations === 'dropped') throw new Error('Transaction was dropped')

      if (typeof tx.confirmations === 'number') {
        return {
          delay: 6000,
          isEffective: tx.confirmations >= confirmations
        }
      } else {
        return {
          delay: 6000,
          isEffective: confirmations === 0 || (confirmations > 0 && tx.confirmations === 'confirmed')
        }
      }
    }
    case 'done': {
      if (effect.error != null) throw effect.error
      return {
        delay: 0,
        isEffective: true
      }
    }
  }
}
