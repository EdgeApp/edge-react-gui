import { filterNull } from '../../../../util/safeFilters'
import { ActionEffect, EffectCheckResult, ExecutionContext, SeqEffect } from '../../types'

export async function checkActionEffect(context: ExecutionContext, effect: ActionEffect): Promise<EffectCheckResult> {
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
      const { address } = effect
      const timestamp = parseInt(address)

      return {
        delay: 300,
        isEffective: Date.now() >= timestamp
      }
    }
    case 'push-event': {
      const { eventId } = effect
      const timestamp = parseInt(eventId)
      return {
        delay: 300,
        isEffective: Date.now() >= timestamp
      }
    }
    case 'price-level': {
      // TODO: Implement
      throw new Error('No implementation for price effect')
    }
    case 'tx-confs': {
      const { txId } = effect
      const timestamp = parseInt(txId)
      return {
        delay: 300,
        isEffective: Date.now() >= timestamp
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
