// @flow

export const PREFIX = 'PRIVATE_KEY_MODAL/SECONDARY_MODAL/'

export const ACTIVATED = PREFIX + 'ACTIVATED'
export const activated = () => ({
  type: ACTIVATED
})

export const DEACTIVATED = PREFIX + 'DEACTIVATED'
export const deactivated = () => ({
  type: DEACTIVATED
})
