import { combineReducers } from 'redux'
import { username } from './SignUp/Username/reducer'

const foo = (state = 'state') => {
	return state
}

const store = combineReducers({
	foo: foo,
	username:	username
})


export default store
