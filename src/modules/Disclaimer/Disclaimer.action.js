export const ACCEPT_DISCLAIMER = 'ACCEPT_DISCLAIMER'
export const SHOW_DISCLAIMER = 'SHOW_DISCLAIMER'

export function acceptDisclaimer () {
  return {
    type: ACCEPT_DISCLAIMER
  }
}
export function showDisclaimer () {
  return {
    type: SHOW_DISCLAIMER
  }
}
