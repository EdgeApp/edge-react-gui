import React, { Component } from 'react'
import { Provider } from 'react-redux'
import Navigator from './Navigator/Navigator'
import store from './createStore'


export default class App extends Component {
	
	render() {
		return (
			<Provider store={store}>
				<Navigator store={store}/>	
			</Provider>
		)
	}
}
