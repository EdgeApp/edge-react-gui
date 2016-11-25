import React, { Component } from 'react'
import Navigator from './Navigator/Navigator'
import createStore from './createStore'

const store = createStore()

export default class App extends Component {
	
	render() {
		return (
		  <Navigator store={store}/>	
		)
	}
}
