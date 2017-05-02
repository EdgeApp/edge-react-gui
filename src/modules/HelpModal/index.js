import React, { Component } from 'react'
import { View, Text, TouchableOpacity, Image, TouchableWithoutFeedback, WebView } from 'react-native';
import { Icon } from 'native-base';
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'
import Modal from 'react-native-modal'

import { closeHelpModal } from './actions.js'

const logo = require("../../img/logo.png")
const webView = require("../../html/info.html")

class HelpModal extends Component {

  render () {
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
              <WebView source={webView}/>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </TouchableWithoutFeedback>
    )
  }

}

export default connect( state => ({

  modal: state.helpModal

}) )(HelpModal)
