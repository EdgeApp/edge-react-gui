/* eslint-disable import/prefer-default-export */
import { Navigation } from 'react-native-navigation';

import Home from './modules/Home';
import Drawer from './modules/Drawer';
export function registerScreens(store, Provider) {
	Navigation.registerComponent('app.Home', () => Home, store, Provider);

	// 	{ title: t('app_name'), 			 screen: 'home', 			index: 0},
	// { title: t('activity_signup_title'), screen: 'createUsername', 	index: 1},
	// { title: t('activity_signup_title'), screen: 'createPin', 		index: 2},
	// { title: t('activity_signup_title'), screen: 'createPassword', 	index: 3},
	// { title: t('activity_signup_title'), 	screen: 'reviewSignIn', 	index: 4}
}