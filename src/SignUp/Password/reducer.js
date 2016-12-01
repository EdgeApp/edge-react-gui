import * as ACTION from './action'

export const inputState = (state = false, action) => {

	switch (action.type) {
		case ACTION.FOCUS_PASSWORD_INPUT :
			return true

		case ACTION.BLUR_PASSWORD_INPUT :
			return false

		default:      
			return state
	}

}

export const password = (state = '', action) => {

	switch (action.type) {
		case ACTION.CHANGE_PASSWORD_VALUE :
 		return action.data

		default:      
			return state
	}

}

export const passwordRepeat = (state = '', action) => {

	switch (action.type) {
		case ACTION.CHANGE_PASSWORD_REPEAT_VALUE :
			return action.data

		default:      
			return state
	}

}

