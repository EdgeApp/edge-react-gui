import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Image, TouchableWithoutFeedback, WebView } from 'react-native';
import { Icon } from 'native-base';
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import Modal from 'react-native-modal'

import { closeHelpModal } from './actions.js'

const logo = require("../../../../img/logo2x.png")
const webView = require("../../../../html/disclaimer.ios.html")

class HelpModal extends Component {

  _renderWebView = () => {
    switch(this.props.routes.scene.sceneKey) {
      case 'scan':
        return require("../../../../html/info_send.html")
      case 'walletList':
        return require("../../../../html/info_wallets.html")
      case 'transactions':
        return require("../../../../html/info_transactions.html")
      case 'request':
        return require("../../../../html/info_request.html")
      case 'sendConfirmation':
        return require("../../../../html/info_send_confirmation.html")
      default:
        return require("../../../../html/info_disclaimer.html")
    }
  }

  render () {
    console.log('this.props', this.props)
    return (
      <TouchableWithoutFeedback onPress={ e => this.props.dispatch(closeHelpModal())}>
        <Modal isVisible={this.props.modal} animationIn='bounceIn' animationOut='bounceOut' style={{margin: 0, paddingVertical: 60, paddingHorizontal: 20}}>
          <TouchableWithoutFeedback>
            <View style={{ flex: 1, backgroundColor: '#FFF' }}>
              <View style={{ flexDirection: 'row'}}>
                <View style={{ width: 40 }}></View>
                <Image source={logo} style={{ flex:1, height: 48, margin: 15 }} resizeMode="contain" />
                <View style={{ width: 40, alignItems: 'center' }}>
                  <TouchableOpacity onPress={ e => this.props.dispatch(closeHelpModal())}>
                    <Icon name="close" style={{ marginTop: 5, fontSize: 36 }}/>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flex: 1, paddingHorizontal: 20}}>
                <WebView source={ this._renderWebView() }/>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </TouchableWithoutFeedback>
    )
  }

}

export default connect( state => ({

  modal: state.ui.helpModal,
  routes: state.routes

}) )(HelpModal)
