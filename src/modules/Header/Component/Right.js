import React, { Component } from 'react'
import { Text, TouchableOpacity } from 'react-native';
import { Icon } from 'native-base';
import { Actions } from 'react-native-router-flux'
import { openHelpModal } from '../../HelpModal/actions.js'
import { connect } from 'react-redux'

class Right extends Component {

  render () {
    switch(this.props.routes.scene.sceneKey) {
      case 'walletList':
        return <HelpButton />
      case 'directory':
        return <HelpButton />
      case 'sendConfirmation':
        return <HelpButton />
      case 'addWallet':
        return <HelpButton />
      default:
        return null
    }
  }

}

class HelpButton extends Component {

  render () {
    return (
      <TouchableOpacity onPress={ e => this.props.dispatch(openHelpModal()) }>
        <Text>Help</Text>
      </TouchableOpacity>
    )
  }

}

export default connect()(HelpButton)
