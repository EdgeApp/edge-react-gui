//@flow
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import SendConfirmationOptions from '../../../scenes/SendConfirmation/SendConfirmationOptionsConnector.js'
import HelpButton from './HelpButton.ui'
// import {View} from 'react-native'
import * as Constants from '../../../../../constants/indexConstants'
import MenuDropDown from '../../../../../connectors/components/HeaderMenuExchangeConnector'

type Props = {
  routes: any
}
export default class Right extends Component<Props> {
  static propTypes = {
    routes: PropTypes.object.isRequired
  }
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
    case Constants.EXCHANGE:
      return <MenuDropDown />
    default:
      return null
    }
  }

}
