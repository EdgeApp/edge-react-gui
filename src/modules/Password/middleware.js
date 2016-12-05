import { navigatorPush } from '../../Navigator/action'

import { openErrorModal } from '../../ErrorModal/action'
import t from "../../lib/LocaleStrings"
export const checkPassword = ( password, passwordRepeat, validation) => {

	return dispatch => {

		if( !validation.upperCaseChar || !validation.lowerCaseChar || !validation.number || !validation.characterLength	) {
			return dispatch(openErrorModal(t('activity_signup_insufficient_password')))	
		}
		
		if( password !== passwordRepeat ) {
			return dispatch(openErrorModal(t('activity_signup_passwords_dont_match')))	
		}

		if( validation.upperCaseChar && validation.lowerCaseChar && validation.number && validation.characterLength && password === passwordRepeat){
			return dispatch(navigatorPush())
		}
	}
} 
