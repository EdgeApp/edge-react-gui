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

    _handleOnPressRouting (route) {
        console.log('in SettingsItems.ui.js, route is: ', route)
        Actions[route]()
        console.log('goRoute is: ', goRoute)
        goRoute()        
    }

    render() {
        console.log('rendering settingsOverviewItem, this is: ', this)
        return(
            <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this.props.routeFunction()} >
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
SettingsItemWithRoute.propTypes = {
  scene: PropTypes.string,
  leftText: PropTypes.string
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
SettingsItemWithModal.propTypes = {
  modal: PropTypes.string,
  leftText: PropTypes.string
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
            <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this._handleOnPressToggleSetting(this.props.property)} >
                <View style={[s.settingsRowTextRow, border('red')]}>
                    <View style={[s.settingsRowLeftContainer, border('blue')]}>
                        <T style={[s.settingsRowLeftText, border('green')]}>{this.props.leftText}</T>
                    </View>
                    <Switch onValueChange={ () => { this._onToggleOption(this.props.property) } } value={false} />                    
                </View>
            </TouchableOpacity>
        )
    }
}
SettingsItemWithSwitch.propTypes = {
  leftText: PropTypes.string,
  property: PropTypes.string
}

export {SettingsItemWithRoute, SettingsItemWithModal, SettingsItemWithSwitch}