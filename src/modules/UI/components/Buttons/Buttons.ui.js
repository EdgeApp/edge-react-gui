import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableOpacity, Text, View, TouchableHighlight, Animated } from 'react-native'
import T from '../FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import s from './style'
import {border} from '../../../../util/border'

class BlueButton extends Component {
    constructor(props) {
        super(props)
        let text = this.props.text || 'Done'
    }

    render() {
        return(
            <TouchableHighlight onPress={this.props.onPressFunction} style={[s.doneButtonWrap, s.stylizedButton, border('orange')]}>
                <View style={s.stylizedButtonTextWrap}>
                    <T style={[s.doneButton, s.stylizedButtonText]}>{this.props.text}</T>
                </View>
            </TouchableHighlight>
        )
    }
}
BlueButton.propTypes = {
    text: PropTypes.string,
    onPressFunction: PropTypes.func
}

class GreyButton extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return(
            <TouchableHighlight onPress={this.props.onPressFunction} style={[s.cancelButtonWrap, s.stylizedButton]}>
                <View style={s.stylizedButtonTextWrap}>
                    <T style={[s.cancelButton, s.stylizedButtonText]}>Cancel</T>
                </View>
            </TouchableHighlight>
        )
    }
}
GreyButton.propTypes = {
    text: PropTypes.string,
    onPressFunction: PropTypes.func
}

export {BlueButton, GreyButton}