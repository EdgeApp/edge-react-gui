import { CleanError } from '../cleaners'
import { ActionEffect } from '../types'

export function getEffectErrors(effect?: ActionEffect | null): CleanError[] {
  if (effect != null) {
    if (effect.type === 'done' && effect.error != null) return [effect.error]
    if (effect.type === 'seq' || effect.type === 'par')
      return effect.childEffects.reduce((errors: CleanError[], effect) => [...errors, ...getEffectErrors(effect)], [])
  }
  return []
}
