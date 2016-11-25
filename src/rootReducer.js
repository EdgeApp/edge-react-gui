import { combineReducers } from 'redux'
import { username } from './SignUp/Username/reducer'
import { pinNumber } from './SignUp/PinNumber/reducer'

const store = combineReducers({
	username,
	pinNumber
})


export default store
