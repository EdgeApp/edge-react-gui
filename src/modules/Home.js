import { connect } from 'react-redux'
import React, { Component } from 'react'
import { Text, Button, View, StyleSheet, Image } from 'react-native'
import t from '../lib/LocaleStrings'
import LoaderOverlay from '../Loader/LoaderOverlay'
class HomeComponent extends Component {
	constructor(props) {
		super(props);

		this._openSignup = this._openSignup.bind(this);
		this._openUserCache = this._openUserCache.bind(this);
	}
	_openSignup() {
		this.props.navigator.push({
		  screen: 'app.Signup',
		  title: ''
		});		
	}
	_openUserCache() {
		this._toggleDrawer();
		this.props.navigator.showModal({
			screen: 'app.UserCache',
			title: ''
		});
	}
	render() {
		Reactotron.log('hello rendering world');
		return (	
			<View>
				<Image source={require('../assets/drawable/background.jpg')} style={styles.backgroundImage}>
					<Text style={styles.welcome}>
						{t('app_name')}
					</Text>
					<Button
						onPress={this.handleOnPress}
						title={t('activity_signup_title')}
						color="#841584"
						accessibilityLabel={t('activity_signup_title')}
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
