import React, { Component } from 'react'
import { Text, TouchableOpacity } from 'react-native'
import { Icon } from 'native-base'
import { Actions } from 'react-native-router-flux'

export default class Left extends Component {

  render () {
    switch (this.props.routes.scene.sceneKey) {
      case 'directory':
        return <BackButton />
      case 'sendConfirmation':
        return <BackButton />
      case 'createWallet':
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
        <Icon name='arrow-back' />
      </TouchableOpacity>
    )
  }

}
