import React, {Component} from 'react'
import {
  View,
  TouchableOpacity,
  Image,
  TouchableWithoutFeedback,
  WebView
} from 'react-native'
import {Icon} from 'native-base'
import Modal from 'react-native-modal'
import logo from '../../../../img/logo2x.png'

export default class HelpModal extends Component {
  _renderWebView = () => {
    const scene = this.props.routes.scene
    const children = scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case 'scan':
      return require('../../../../html/enUS/info_send.html')
    case 'walletList':
      return require('../../../../html/enUS/info_wallets.html')
    case 'transactionList':
      return require('../../../../html/enUS/info_transactions.html')
    case 'transactionDetails':
      return require('../../../../html/enUS/transaction_details.html')
    case 'request':
      return require('../../../../html/enUS/info_request.html')
    case 'sendConfirmation':
      return require('../../../../html/enUS/info_send_confirmation.html')
    default:
      return require('../../../../html/enUS/info_disclaimer.html')
    }
  }

  render () {
    // console.log('this.props', this.props)
    return (
      <TouchableWithoutFeedback onPress={this.props.closeModal}>
        <Modal style={{margin: 0, paddingVertical: 60, paddingHorizontal: 20}}
          isVisible={this.props.modal}
          animationIn='bounceIn'
          animationOut='bounceOut'>

            <View style={{flex: 1, backgroundColor: '#FFF'}}>
              <View style={{flexDirection: 'row'}}>
                <View style={{width: 40}} />
                <Image source={logo} style={{flex: 1, height: 48, margin: 15}} resizeMode='contain' />

                <View style={{width: 40, alignItems: 'center'}}>
                  <TouchableOpacity onPress={this.props.closeModal}>
                    <Icon name='close' style={{marginTop: 5, fontSize: 36}} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{flex: 1, paddingHorizontal: 20}}>
                <WebView source={this._renderWebView()} />
              </View>

            </View>
        </Modal>
      </TouchableWithoutFeedback>
    )
  }
}
