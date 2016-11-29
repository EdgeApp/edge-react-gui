import * as ACTION from './action'

export const loading = (state = false, action) => {

	switch (action.type) {
		case ACTION.LOADING_ON  :
			return true

		case ACTION.LOADING_OFF :
			return false

		default:      
			return state
	}

}
