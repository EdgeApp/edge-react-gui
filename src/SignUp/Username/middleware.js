import async_auto from 'async/auto'

import routes from '../../Navigator/routes'
import abcContext from '../../abc/abcContext'

import { openErrorModal } from '../../ErrorModal/action'
import { openLoading, closeLoading } from '../../Loader/action'

export const checkUsername = (username, navigator) => {

	return dispatch => {

		async_auto({
			checkUsernameLength: function(callback) {
				
				if(username.length >= 3){
					callback(null, null);
				}else{
					callback( 'Username must be at least 3 characters', null);
				}

			},
			openLoading: function(callback) {

				dispatch(openLoading('Checking username availability'))
				callback(null, null);

			},
			getUsernameAvailability: function(callback) {

				setTimeout( () => {
					abcContext.usernameAvailable(username,function (error, available) {
						if(error) {
							callback('Username is not available', null);
						}
						if (!error) {
							callback(null, null);
						}
					})
				}, 500)

			}
		}, function(err, results) {
			dispatch(closeLoading())

			if(err){
				dispatch(openErrorModal(err))
			}
			if(!err){
				navigator.push(routes[2])
			}
		});
	
	}

} 
