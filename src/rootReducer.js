import { combineReducers } from 'redux'
import { username } from './SignUp/Username/reducer'
import { pinNumber } from './SignUp/PinNumber/reducer'
import { loading } from './Loader/reducer'
import * as ErrorModal from './ErrorModal/reducer' 

const store = combineReducers({
	username,
	pinNumber,
	loading,
	errorModal : combineReducers({
		visible : 	ErrorModal.visible,
		message :	ErrorModal.message
	})
})


export default store
