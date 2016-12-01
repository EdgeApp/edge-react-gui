export const UPPER_CASE_PASS 		= 'UPPER_CASE_TRUE'
export const UPPER_CASE_FAIL 		= 'UPPER_CASE_FALSE'
export const LOWER_CASE_PASS 		= 'LOWER_CASE_TRUE'
export const LOWER_CASE_FAIL 		= 'LOWER_CASE_FALSE'
export const NUMBER_PASS		 	= 'NUMBER_TRUE'
export const NUMBER_FAIL		 	= 'NUMBER_FALSE'
export const CHARACTER_LENGTH_PASS	= 'CHARACTER_LENGTH_PASS'
export const CHARACTER_LENGTH_FAIL	= 'CHARACTER_LENGTH_FAIL'

export function focusPasswordInput() {
	return {
		type: FOCUS_PASSWORD_INPUT	
	}
}

export function blurPasswordInput() {
	return {
		type: BLUR_PASSWORD_INPUT	
	}
}

export function changePasswordValue(data) {
	return {
		type: CHANGE_PASSWORD_VALUE,
		data
	}
}

export function changePasswordRepeatValue(data) {
	return {
		type: CHANGE_PASSWORD_REPEAT_VALUE,
		data
	}
}
