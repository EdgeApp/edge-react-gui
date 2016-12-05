import tron from '../util/reactotron';
import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Text, Image, StyleSheet } from 'react-native'
import {Container, Content, Button, Icon} from 'native-base';
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
		<Container>
			<Content>
				<Image source={require('../assets/drawable/background.jpg')} style={styles.backgroundImage}>
					<Image source={require('../assets/drawable/logo.png')} style={styles.logoImage}/>
					<Button
						style={styles.signupButton}
						onPress={this._openSignUp}
						accessibilityLabel={t('fragment_landing_signup_button')}>
						{t('fragment_landing_signup_button')}
					</Button>
					<Button
						style={styles.signinButton}
						onPress={this._openLogin}
						accessibilityLabel={t('fragment_landing_signin_button')}>
						{t('fragment_landing_signin_button')}
					</Button>
					<Button
						onPress={this._openCrash}>
						CRASH
					</Button>					
				</Image>
			</Content>
		</Container>
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
		justifyContent: 'flex-start',
		alignItems: 'center',
		resizeMode: Image.resizeMode.cover,
		flex:1,
		width: null
	},
	logoImage: {
		flex:0,
		alignSelf: 'center'
	},
	signInButton: {
		flex: 1,
		margin: 20,
		color: '#FFF',
		alignSelf: 'center',
		backgroundColor: '#841584'
	},
	signUpButton: {
		flex: 1,
		margin: 20,
		color: '#FFF',
		alignSelf: 'center',
		backgroundColor: '#000088'
	}
});

export default connect()(HomeComponent)
