import { openErrorModal } from '../../ErrorModal/action'
import { navigatorPush } from '../../Navigator/action'

export const checkPIN = (pin, navigator) => {

	return dispatch => {

		if(pin.length === 4){
			dispatch(navigatorPush())
		}else{
			dispatch(openErrorModal('PIN must be 4 digits'))
		}

	}
} 
