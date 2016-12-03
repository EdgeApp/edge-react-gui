import * as ACTION from './action'

export const skipButtonVisible = (state = false, action) => {

	switch (action.type) {
		case ACTION.SKIP_BUTTON_HIDE:
			return false

		case ACTION.SKIP_BUTTON_SHOW:
			return true

		default:      
			return state
	}

}
