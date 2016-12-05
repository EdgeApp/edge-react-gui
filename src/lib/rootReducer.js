import { combineReducers } from 'redux'

import { username } from './SignUp/Username/reducer'
import { pinNumber } from './SignUp/PinNumber/reducer'
import { loading } from './Loader/reducer'
import { route, navigator } from './Navigator/reducer'
import { nextButtonVisible } from './SignUp/NextButton/reducer'
import { skipButtonVisible } from './SignUp/SkipButton/reducer'
import * as PasswordStates from './SignUp/Password/reducer'
import { reviewDetails } from './SignUp/ReviewDetails/reducer'
import * as PasswordValidation from './SignUp/Password/PasswordValidation/reducer'
import * as Loader from './Loader/reducer' 
import * as ErrorModal from './ErrorModal/reducer' 

const store = combineReducers({
	username,
	pinNumber,
	loading,
	password	: combineReducers({
		inputState		: PasswordStates.inputState,
		password 		: PasswordStates.password,
		passwordRepeat 	: PasswordStates.passwordRepeat,
		notification	: PasswordStates.notification,
		validation 		: combineReducers({
			upperCaseChar	: PasswordValidation.upperCaseChar,
			lowerCaseChar	: PasswordValidation.lowerCaseChar,
			number			: PasswordValidation.number,
			characterLength	: PasswordValidation.characterLength
		})
	}),
	reviewDetails,

	nextButtonVisible,
	skipButtonVisible,

	route,
	loader 		: combineReducers({
		loading : 	Loader.loading,
		message :	Loader.message
	}),
	errorModal 	: combineReducers({
		visible : 	ErrorModal.visible,
		message :	ErrorModal.message
	})
})


export default store
