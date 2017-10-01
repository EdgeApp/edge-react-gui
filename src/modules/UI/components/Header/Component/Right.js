import React, {Component} from 'react'
import SendConfirmationOptions from '../../../scenes/SendConfirmation/SendConfirmationOptionsConnector.js'
import HelpButton from './HelpButton.ui'
import * as Constants from '../../../../../constants'

export default class Right extends Component {

  render () {
    const children = this.props.routes.scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case Constants.SCAN:
      return <HelpButton />
    case Constants.WALLET_LIST:
      return <HelpButton />
    case Constants.TRANSACTION_LIST:
      return <HelpButton />
    case Constants.TRANSACTION_DETAILS:
      return <HelpButton />
    case Constants.REQUEST:
      return <HelpButton />
    case Constants.SEND_CONFIRMATION:
      return <SendConfirmationOptions />
    case Constants.CREATE_WALLET:
      return <HelpButton />
    default:
      return null
    }
  }

}
