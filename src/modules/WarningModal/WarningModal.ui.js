import React, { Component } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux'
import { closeWarningModal } from './WarningModal.action'
import { deleteUserToCache } from '../CachedUsers/CachedUsers.middleware'
import appTheme from '../../../Themes/appTheme'

import t from '../../lib/LocaleStrings'

class WarningModal extends Component {

  handleDeleteUsersFromCache = () => {
    this.props.dispatch(
      deleteUserToCache(
        this.props.userToDeleteFromUserCache
      )
    )
  }

  checkHandleSubmit = () => {
    switch (this.props.module) {
      case 'deleteCachedUser' :
        return this.handleDeleteUsersFromCache

      default:
        return null
    }
  }

  handleClose = () => {
    this.props.dispatch(closeWarningModal())
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
        <Text style={[ style.textWarning, style.textLead ]}>{ this.props.title }</Text>
        <Text style={style.textWarning}>{ this.props.message }</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={this.handleClose} >
            <Text style={style.hideModal}>{t('string_cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.checkHandleSubmit()} >
            <Text style={style.hideModal}>{t('string_ok')}</Text>
          </TouchableOpacity>
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

  textWarning: {
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
  visible: state.warningModal.visible,
  module: state.warningModal.module,
  title: state.warningModal.title,
  message: state.warningModal.message,
  userToDeleteFromUserCache: state.cachedUsers.userToDeleteFromUserCache
}))(WarningModal)
