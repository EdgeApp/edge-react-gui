import { openErrorModal } from '../../ErrorModal/action'
import { navigatorPush } from '../../Navigator/action'
import t from "../../lib/LocaleStrings"
export const checkPIN = (pin, navigator) => {

	return dispatch => {

		if(pin.length === 4){
			dispatch(navigatorPush())
		}else{
			dispatch(openErrorModal(t('activity_signup_insufficient_pin')))
		}

	}
} 
