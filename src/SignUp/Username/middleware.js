import async_auto from 'async/auto'

import abcContext from '../../abc/abcContext'

import { openErrorModal } from '../../ErrorModal/action'
import { openLoading, closeLoading } from '../../Loader/action'

import t from "../../lib/LocaleStrings"
export const checkUsername = username => {

	return dispatch => {

		async_auto({
			openLoading: function(callback) {

				dispatch(openLoading(t('activity_signup_checking_username')));
				callback(null, null);

			},
			getUsernameAvailability: function(callback) {

				setTimeout( () => {
					abcContext.usernameAvailable(username,function (error, available) {
						if(error) {
							callback(t('activity_signup_username_unavailable'), null);
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
				dispatch(openErrorModal'You have successfully log in'))
			}
		});
	
	}

} 
