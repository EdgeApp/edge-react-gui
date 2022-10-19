import { ActionEffect } from '../types'

export function checkEffectIsDone(effect?: ActionEffect | null): boolean {
  return (
    effect != null &&
    (effect.type === 'done' ||
      // Future refactor might included nested done effects:
      (effect.type === 'seq' && effect.childEffects.some(effect => checkEffectIsDone(effect))) ||
      (effect.type === 'par' && effect.childEffects.every(effect => checkEffectIsDone(effect))))
  )
}
