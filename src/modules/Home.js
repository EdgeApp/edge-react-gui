import tron from '../util/reactotron';
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Text, Button, View, StyleSheet, Image } from 'react-native'
import t from '../lib/LocaleStrings'
import LoaderOverlay from '../Loader/LoaderOverlay'
import {Router} from "../app"
class HomeComponent extends Component {
	constructor(props) {
		super(props);

		this._openSignup = this._openSignup.bind(this);
		this._openCrash = this._openCrash.bind(this);
		this._openUserCache = this._openUserCache.bind(this);
	}

	/**
    * This is where we can define any route configuration for this
    * screen. For example, in addition to the navigationBar title we
    * could add backgroundColor.
    */
	static route = {
		userCacheOpen: false,
    navigationBar: {
      title: t('app_name')
    }
  };
	_openSignup() {
		this.props.navigator.push(Router.getRoute('signup'));		
	}
	_openCrash() {
		this.props.navigator.push(Router.getRoute('fakecrash'));		
	}	
	_openUserCache() {
		this.props.navigator.updateCurrentRouteParams({userCacheOpen:true});
	}
	render() {
		return (	
			<View>
				<Image source={require('../assets/drawable/background.jpg')} style={styles.backgroundImage}>
					<Text style={styles.welcome}>
						{t('app_name')}
					</Text>
					<Button
						onPress={this._openSignup}
						title={t('activity_signup_title')}WTF
						color="#841584"
						accessibilityLabel={t('activity_signup_title')}
					/>
					<Button
						onPress={this._openCrash}
						title="crash"
						color="#FF0000"
					/>
				</Image>
			</View>
		);		
	}
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
    color: '#FFFFFF'
  },
	backgroundImage: {
		justifyContent: 'center',
		alignItems: 'stretch'
	}	  
});

export default connect()(HomeComponent)
