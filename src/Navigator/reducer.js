import * as ACTION from './action'
import routes from './routes'

export const route = (state = routes[0], action) => {

	switch (action.type) {
		case ACTION.NAVIGATOR_NEXT  : 
			return routes[state.index + 1]

		case ACTION.NAVIGATOR_PREVIOUS :
			return routes[state.index - 1]

		default:      
			return state
	}

}
