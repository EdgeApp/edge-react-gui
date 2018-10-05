// @flow

export const activated = () => ({
  type: 'UNIQUE_IDENTIFIER_MODAL/ACTIVATED'
})

export const deactivated = () => ({
  type: 'UNIQUE_IDENTIFIER_MODAL/DEACTIVATED'
})

export const reset = () => ({
  type: 'UNIQUE_IDENTIFIER_MODAL/RESET'
})

export const uniqueIdentifierChanged = (uniqueIdentifier: string) => ({
  type: 'UNIQUE_IDENTIFIER_MODAL/UNIQUE_IDENTIFIER_CHANGED',
  data: { uniqueIdentifier }
})
