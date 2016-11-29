import React, { Component } from 'react';
import { AppRegistry, View } from 'react-native';
import App from './src/App'

export default class airbitz_ui extends Component {
	render() {
		return (
			<App />
		);
	}
}

AppRegistry.registerComponent('airbitz_ui', () => airbitz_ui);
