import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {
  Switch,
  TouchableOpacity,
  Image,
  ScrollView,
  ListView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableHighlight,
  Animated } from 'react-native'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { Actions } from 'react-native-router-flux'
import s from './style'
import {border as b} from '../../../utils'

class SettingsItemWithRoute extends Component {
  _handleOnPressRouting (route) {
    Actions[route]()
    goRoute()
  }

  render () {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false}
        onPress={() => this.props.routeFunction()}>

        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>{this.props.leftText}</T>
          </View>
          <MAIcon name='chevron-right' size={24} style={[s.settingsRowRightArrow, b('blue')]} color='#58595C' />
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
  _toggleModal = (modalKey) => {
    console.log('toggle modal: ', modalKey)
  }

  render() {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false}
        onPress={this._toggleModal(this.props.modal)}>

        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>{this.props.leftText}</T>
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
  _onPressToggleSetting = (property) => {
    console.log('toggline property: ', property)
  }

  render () {
    return (
      <TouchableOpacity style={[s.settingsRowContainer]} disabled={false}
        onPress={() => this._handleOnPressToggleSetting(this.props.property)}>

        <View style={[s.settingsRowTextRow, b('red')]}>
          <View style={[s.settingsRowLeftContainer, b('blue')]}>
            <T style={[s.settingsRowLeftText, b('green')]}>{this.props.leftText}</T>
          </View>
          <Switch
            onValueChange={ () => { this._onToggleOption(this.props.property) } } value={false} />
        </View>

      </TouchableOpacity>
    )
  }
}
SettingsItemWithSwitch.propTypes = {
  leftText: PropTypes.string,
  property: PropTypes.string
}

export {
  SettingsItemWithRoute,
  SettingsItemWithModal,
  SettingsItemWithSwitch
}
