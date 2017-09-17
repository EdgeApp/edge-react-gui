import React, {Component} from 'react'
import SendConfirmationOptions from '../../../scenes/SendConfirmation/SendConfirmationOptions.js'
import HelpButton from './HelpButton.ui'

export default class Right extends Component {

  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case 'scan':
      return <HelpButton />
    case 'walletList':
      return <HelpButton />
    case 'directory':
      return <HelpButton />
    case 'transactionList':
      return <HelpButton />
    case 'transactionDetails':
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
