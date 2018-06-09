// @flow

export const PREFIX = 'UNIQUE_IDENTIFIER_MODAL/'
export const ACTIVATED = PREFIX + 'ACTIVATED'
export const DEACTIVATED = PREFIX + 'DEACTIVATED'
export const UNIQUE_IDENTIFIER_CHANGED = PREFIX + 'UNIQUE_IDENTIFIER_CHANGED'
export const RESET = PREFIX + 'RESET'

export const activated = () => ({
  type: ACTIVATED
})

export const deactivated = () => ({
  type: DEACTIVATED
})

export const reset = () => ({
  type: RESET
})

export const uniqueIdentifierChanged = (uniqueIdentifier: string) => ({
  type: UNIQUE_IDENTIFIER_CHANGED,
  data: { uniqueIdentifier }
})
