import { ActionEffect } from '../types'

export function getEffectPushEventIds(effect?: ActionEffect | null): string[] {
  if (effect != null) {
    if (effect.type === 'push-event') return [effect.eventId]
    if (effect.type === 'seq' || effect.type === 'par')
      return effect.childEffects.reduce((eventIds: string[], effect) => [...eventIds, ...getEffectPushEventIds(effect)], [])
  }
  return []
}
