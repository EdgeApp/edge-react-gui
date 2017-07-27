import React, { Component } from 'react'
import { TouchableOpacity } from 'react-native'
import { Text } from 'native-base'
import { Actions } from 'react-native-router-flux'

export default class Left extends Component {
  render () {
    switch (this.props.routes.scene.sceneKey) {
      case 'directory':
        return <BackButton />
      case 'sendConfirmation':
        return <SendConfirmationBackButton />
      case 'createWallet':
        return <BackButton />
      case 'transactionList':
        return this.props.routes.scene.params === 'walletList' ? <BackButton /> : null
      case 'btcSettings':
        return <BackButton />
      case 'ethSettings':
        return <BackButton />
      default:
        return null
    }
  }
}

class BackButton extends Component {
  render () {
    return (
      <TouchableOpacity onPress={e => Actions.pop()}>
        <Text>Back</Text>
      </TouchableOpacity>
    )
  }
}

class SendConfirmationBackButton extends Component {
  render () {
    return (
      <TouchableOpacity onPress={e => Actions.scan()}>
        <Text>Back</Text>
      </TouchableOpacity>
    )
  }
}
