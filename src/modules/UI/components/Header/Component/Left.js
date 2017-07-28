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
        return <BackButton syntax='Back' onPressFxn={e => Actions.scan()} />
      case 'createWallet':
        return <BackButton syntax='Cancel' />
      case 'transactionList':
        return this.props.routes.scene.params === 'walletList' ? <BackButton /> : null
      case 'btcSettings':
        return <BackButton syntax='Back' />
      case 'ethSettings':
        return <BackButton syntax='Back' />
      case 'transactionDetails':
        return <BackButton syntax='Cancel' />
      default:
        return null
    }
  }
}

class BackButton extends Component {
  constructor (props) {
    super(props)
    this.props.pressFxn = this.props.onPressFxn ? this.props.onPressFxn : Actions.pop
    this.props.syntax = this.props.syntax ? this.props.syntax : 'Back'
  }

  render () {
    return (
      <TouchableOpacity onPress={this.props.onPressFxn ? this.props.onPressFxn : (e) => Actions.pop()}>
        <Text>{this.props.syntax}</Text>
      </TouchableOpacity>
    )
  }
}
