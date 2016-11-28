import React, { Component } from 'react'
import { 
	Text, 
	Button,
	View,
	StyleSheet } from 'react-native'
import t from '../lib/LocaleStrings'

class HomeComponent extends Component {
	
	handleOnPress  = () => {
		this.props.navigator.push({ title: t('activity_signup_title'), screen: 'createUsername', index: 1})
	}

	render() {
		return (
			<View>
				<Text style={styles.welcome}>
					{t('app_name')}
				</Text>
				<Button
					onPress={this.handleOnPress}
					title={t('activity_signup_title')}
					color="#841584"
					accessibilityLabel={t('activity_signup_title')}
				/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 30,
    textAlign: 'left',
    margin: 10,
  }
});

export default HomeComponent
