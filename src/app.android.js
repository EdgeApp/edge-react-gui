import tron from './util/reactotron';
import React, { Component } from 'react'; // eslint-disable-line
import { Provider as ReduxProvider,connect } from 'react-redux';
import { AppRegistry, View, StatusBar } from 'react-native';
import configureStore from './configureStore';
import t from "./lib/LocaleStrings";

const Store = configureStore();

/**
 * If you're using Exponent, uncomment the line below to import Exponent
 * BEFORE importing `@exponent/ex-navigation`. This sets the status bar
 * offsets properly.
 */
// import Exponent from 'exponent';

import {
  createRouter,
  NavigationProvider,
  StackNavigation,
} from '@exponent/ex-navigation';

/**
  * This is where we map route names to route components. Any React
  * component can be a route, it only needs to have a static `route`
  * property defined on it, as in HomeScreen below
  */

import Home from './modules/Home';
import Drawer from './modules/Drawer';  
export const Router = createRouter(() => ({
  home: () => Home,
  signup: () => Drawer
}));

class App extends Component {
  render() {
    /**
      * NavigationProvider is only needed at the top level of the app,
      * similar to react-redux's Provider component. It passes down
      * navigation objects and functions through context to children.
      *
      * StackNavigation represents a single stack of screens, you can
      * think of a stack like a stack of playing cards, and each time
      * you add a screen it slides in on top. Stacks can contain
      * other stacks, for example if you have a tab bar, each of the
      * tabs has its own individual stack. This is where the playing
      * card analogy falls apart, but it's still useful when thinking
      * of individual stacks.
      */
    return (
    	<View style={{flex: 1}}>
	      <NavigationProvider router={Router}>
		      <StatusBar barStyle="default" />
	      	<ReduxProvider store={Store}>
	        	<StackNavigation 
	        		id="root"
	        		initialRoute={Router.getRoute('home')} />
	        </ReduxProvider>
	      </NavigationProvider>
      </View>
    );
  }
}
AppRegistry.registerComponent('airbitz_ui', () => App);
