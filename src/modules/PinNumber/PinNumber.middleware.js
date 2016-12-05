import { openErrorModal } from '../ErrorModal/ErrorModal.action'

import t from '../../lib/LocaleStrings'
export const checkPIN = (pin, navigator) => {
  return dispatch => {
    if (pin.length === 4) {
      dispatch(openErrorModal(t('YAY')))
    } else {
      dispatch(openErrorModal(t('activity_signup_insufficient_pin')))
    }
  }
}
