import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'
import { Text } from 'native-base'
import { openHelpModal } from '../../HelpModal/actions.js'
import { connect } from 'react-redux'
import SendConfirmationOptions from '../../../scenes/SendConfirmation/SendConfirmationOptions.js'

class HelpButton extends Component {
  render () {
    return (
      <TouchableOpacity onPress={e => this.props.dispatch(openHelpModal())}>
        <Text>Help</Text>
      </TouchableOpacity>
    )
  }
}

const HelpButtonConnect = connect()(HelpButton)

export default class Right extends Component {

  render () {
    switch (this.props.routes.scene.sceneKey) {
      case 'scan':
        return <HelpButtonConnect />
      case 'walletList':
        return <HelpButtonConnect />
      case 'directory':
        return <HelpButtonConnect />
      case 'transactions':
        return <HelpButtonConnect />
      case 'request':
        return <HelpButtonConnect />
      case 'sendConfirmation':
        return <SendConfirmationOptions />
      case 'createWallet':
        return <HelpButtonConnect />
      default:
        return null
    }
  }

}
