import routes from '../../Navigator/routes'

import { openErrorModal } from '../../ErrorModal/action'

export const checkPIN = (pin, navigator) => {

	return dispatch => {

		if(pin.length === 4){
			navigator.push(routes[3])
		}else{
			dispatch(openErrorModal('PIN must be 4 digits'))
		}

	}
} 
