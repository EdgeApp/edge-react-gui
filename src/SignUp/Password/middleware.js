import { navigatorPush } from '../../Navigator/action'

import { openErrorModal } from '../../ErrorModal/action'

export const checkPassword = ( password, passwordRepeat, validation) => {

	return dispatch => {

		if( !validation.upperCaseChar || !validation.lowerCaseChar || !validation.number || !validation.characterLength	) {
			return dispatch(openErrorModal('Your password does not meet the requirements'))	
		}
		
		if( password !== passwordRepeat ) {
			return dispatch(openErrorModal('Password does not match the re-enter password'))	
		}

		if( validation.upperCaseChar && validation.lowerCaseChar && validation.number && validation.characterLength && password === passwordRepeat){
			return dispatch.navigatorPush()
		}
	}
} 
