import React, { Component } from 'react'
import { 
	View,
	Text, 
	StyleSheet,
	TouchableHighlight
} from 'react-native'
import t from '../lib/LocaleStrings'

class NextButton extends Component {

	render() {
		return (
			<View>
				<TouchableHighlight style={styles.nextButton} onPress={this.props.onPress}>
					<Text style={styles.nextButtonChange}>{t('string_next')}</Text>
				</TouchableHighlight>
			</View>
		);
	}

}

const styles = StyleSheet.create({

	nextButton: {
		backgroundColor: 'limegreen',
		height: 60
	},

	nextButtonChange: {
		textAlign: 'center',	
		color: '#FFF',
		paddingTop:10,
		fontSize: 25
	}

});

export default NextButton
