import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'
import { Text, Icon } from 'native-base'
import { Actions } from 'react-native-router-flux'
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

HelpButton = connect()(HelpButton)

export default class Right extends Component {

  render () {
    switch (this.props.routes.scene.sceneKey) {
      case 'scan':
        return <HelpButton />
      case 'walletList':
        return <HelpButton />
      case 'directory':
        return <HelpButton />
      case 'transactions':
        return <HelpButton />
      case 'request':
        return <HelpButton />
      case 'sendConfirmation':
        return <SendConfirmationOptions />
      case 'createWallet':
        return <HelpButton />
      default:
        return null
    }
  }

}
