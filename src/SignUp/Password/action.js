export const FOCUS_PASSWORD_INPUT 			= 'FOCUS_PASSWORD_INPUT'
export const BLUR_PASSWORD_INPUT 			= 'BLUR_PASSWORD_INPUT'
export const CHANGE_PASSWORD_VALUE			= 'CHANGE_PASSWORD_VALUE'
export const CHANGE_PASSWORD_REPEAT_VALUE	= 'CHANGE_PASSWORD_REPEAT_VALUE'

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
