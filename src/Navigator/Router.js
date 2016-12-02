import React, { Component } from 'react'
import { connect } from 'react-redux'

import routes from '../Navigator/routes'

class Router extends Component {

	componentWillReceiveProps(nextProps){
		if(this.props.route.index !== nextProps.route.index) {
			if(this.props.route.index > nextProps.route.index){
				this.props.navigator.pop()
			}
			if(this.props.route.index < nextProps.route.index){
				this.props.navigator.push(nextProps.route)
			}
		}
	}
	
	render() {
		return null	
	}
}

export default connect( state=> ({
	
	route	: state.route

}) )(Router)
