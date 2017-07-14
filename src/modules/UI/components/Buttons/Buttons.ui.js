import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Button, TouchableOpacity, Text, View, TouchableHighlight, Animated } from 'react-native'
import T from '../FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import s from './style'
import {border as b} from '../../../utils'

class PrimaryButton extends Component {
    constructor(props) {
        super(props)
        let text = this.props.text || 'Done'
    }

    render() {
        return(
            <TouchableHighlight onPress={this.props.onPressFunction} style={[s.primaryButtonWrap, s.stylizedButton, b('orange')]}>
                <View style={s.stylizedButtonTextWrap}>
                    <T style={[s.primaryButton, s.stylizedButtonText]}>{this.props.text}</T>
                </View>
            </TouchableHighlight>
        )
    }
}
PrimaryButton.propTypes = {
    text: PropTypes.string,
    onPressFunction: PropTypes.func
}

class SecondaryButton extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return(
            <TouchableHighlight onPress={this.props.onPressFunction} style={[s.secondaryButtonWrap, s.stylizedButton]}>
                <View style={s.stylizedButtonTextWrap}>
                    <T style={[s.secondaryButton, s.stylizedButtonText]}>Cancel</T>
                </View>
            </TouchableHighlight>
        )
    }
}
SecondaryButton.propTypes = {
    text: PropTypes.string,
    onPressFunction: PropTypes.func
}

class TertiaryButton extends Component {
    constructor(props) {
        super(props)
        this.state = {
            bgColor: 'white'
        }
    }

    _onPress = () => {
        this.setState({bgColor: 'rgba(73,119,187,0.2)'})
        this.props.onPressFunction()
    }

    render() {
        console.log('tertiaryButon props are: ', this.props)
        return(
            <TouchableHighlight onPress={this._onPress} underlayColor={'rgba(73,119,187,0.1)'} style={[s.stylizedButton, s.tertiaryButtonWrap,{backgroundColor: 'white'}]} >
                <Text style={s.tertiaryButton} {...this.props} >{this.props.text}</Text>
            </TouchableHighlight>
        )
    }
}
TertiaryButton.propTypes = {
    text: PropTypes.string,
    onPressFunction: PropTypes.func
}

export {PrimaryButton, SecondaryButton, TertiaryButton}