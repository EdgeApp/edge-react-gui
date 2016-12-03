import tron from './util/reactotron';
import React from 'react'; // eslint-disable-line
import { Provider } from 'react-redux';
import { Navigation } from 'react-native-navigation';

import { registerScreens } from './screens';
import configureStore from './configureStore';
import t from "./lib/LocaleStrings";

const store = configureStore();

registerScreens(store, Provider);

const navigatorStyle = {
	statusBarColor: 'black',
	statusBarTextColorScheme: 'light',
	navigationBarColor: 'black',
	navBarBackgroundColor: '#0a0a0a',
	navBarTextColor: 'white',
	navBarButtonColor: 'white',
	tabBarButtonColor: 'red',
	tabBarSelectedButtonColor: 'red',
	tabBarBackgroundColor: 'white'
};

Navigation.startSingleScreenApp({
	screen: {
		screen: 'app.Home',
		title: t('app_name'),
		navigatorStyle
	},
	drawer: {
		left: {
			screen: 'app.Drawer'
		}
	}
});