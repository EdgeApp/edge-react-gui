import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Switch, TouchableOpacity, Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { Actions } from 'react-native-router-flux'
import s from './style'
import {border} from '../../../../util/border'


class SettingsItemWithRoute extends Component {
    constructor(props) {
        super(props)
    }

    _handleOnPressRouting = (route) => {
        let goRoute = Actions[route]
        goRoute()        
    }

    render() {
        console.log('rendering settingsOverviewItem, this is: ', this)
        return(
            <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this._handleOnPressRouting(this.props.scene)} >
                <View style={[s.settingsRowTextRow, border('red')]}>
                    <View style={[s.settingsRowLeftContainer, border('blue')]}>
                        <T style={[s.settingsRowLeftText, border('green')]}>{this.props.leftText}</T>
                    </View>
                    <MAIcon name='chevron-right' size={24} style={[s.settingsRowRightArrow, border('blue')]} color='#58595C' />                      
                </View>
            </TouchableOpacity>
        )
    }
}

class SettingsItemWithModal extends Component {
    constructor(props) {
        super(props)
    }

    _toggleModal = (modalKey) => {
        console.log('toggle modal: ', modalKey)
    }

    render() {
        console.log('rendering SettingsItemWithModal, this is: ', this)
        return(
            <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={this._toggleModal(this.props.modal)} >
                <View style={[s.settingsRowTextRow, border('red')]}>
                    <View style={[s.settingsRowLeftContainer, border('blue')]}>
                        <T style={[s.settingsRowLeftText, border('green')]}>{this.props.leftText}</T>
                    </View>
                    <T style={s.modalRightText}>{this.props.modal}</T>                    
                </View>
            </TouchableOpacity>
        )
    }
}

class SettingsItemWithSwitch extends Component {
    constructor(props) {
        super(props)
    }

    _onPressToggleSetting = (property) => {
        console.log('toggline property: ', property)
    }

    render() {
        console.log('rendering settingsOverviewItem, this is: ', this)
        return(
            <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this._handleOnPressToggleSetting(this.props.scene)} >
                <View style={[s.settingsRowTextRow, border('red')]}>
                    <View style={[s.settingsRowLeftContainer, border('blue')]}>
                        <T style={[s.settingsRowLeftText, border('green')]}>{this.props.leftText}</T>
                    </View>
                    <Switch onValueChange={ () => { this._onToggleOption(property) } } value={false} />                    
                </View>
            </TouchableOpacity>
        )
    }
}

export {SettingsItemWithRoute, SettingsItemWithModal, SettingsItemWithSwitch}