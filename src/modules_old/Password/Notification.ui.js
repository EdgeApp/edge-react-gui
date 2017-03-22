import React, { Component } from 'react'
import { View, Text, TouchableHighlight, StyleSheet } from 'react-native'
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux'
import t from '../../lib/LocaleStrings'
import { passwordNotificationHide } from './Password.action'

import appTheme from '../../../Themes/appTheme'
class ErrorModal extends Component {

  handleClose = () => {
    this.props.dispatch(passwordNotificationHide())
  }

  render () {
    return (
      <Modal
        isOpen={this.props.visible}
        position={'center'}
        style={style.modal}
        animationDuration={200}
        onClosed={this.handleClose}
      >
        <Text style={[ style.textError, style.textLead ]}>{t('fragment_setup_password_nopassword_title')}</Text>
        <Text style={style.textError}>{t('fragment_setup_password_nopassword_message')}</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableHighlight onPress={this.handleClose} >
            <Text style={style.hideModal}>{t('string_cancel')}</Text>
          </TouchableHighlight>
          <TouchableHighlight onPress={this.props.handleSubmit} >
            <Text style={style.hideModal}>{t('string_ok')}</Text>
          </TouchableHighlight>
        </View>
      </Modal>
    )
  }
}

const style = StyleSheet.create({

  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 250,
    padding: 20,
    width: 300
  },

  textError: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: appTheme.fontFamily
  },

  textLead: {
    fontWeight: 'bold',
    color: 'skyblue',
    fontSize: 18,
    fontFamily: appTheme.fontFamily
  },

  hideModal: {
    marginTop: 15,
    marginHorizontal: 10,
    fontSize: 18,
    color: 'skyblue',
    textAlign: 'center'
  }
})

export default connect(state => ({

  visible: state.password.notification

}))(ErrorModal)
