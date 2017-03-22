import { openErrorModal } from '../ErrorModal/ErrorModal.action'
import { Actions } from 'react-native-router-flux'

import t from '../../lib/LocaleStrings'
export const checkPIN = (pin, navigator) => {
  return dispatch => {
    if (pin.length === 4) {
      Actions.password()
    } else {
      dispatch(openErrorModal(t('activity_signup_insufficient_pin')))
    }
  }
}
