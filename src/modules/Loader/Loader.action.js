export const LOADING_ON = 'LOADING_ON'
export const LOADING_OFF = 'LOADING_OFF'

import t from '../../lib/LocaleStrings'

export function openLoading (message, style = 'grey') {
  return {
    type: LOADING_ON,
    message: message || t('string_loading'),
    style
  }
}

export function closeLoading () {
  return {
    type: LOADING_OFF
  }
}
