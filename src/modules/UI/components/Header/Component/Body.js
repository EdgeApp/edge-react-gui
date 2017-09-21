import React, {Component} from 'react'
import {border as b} from '../../../../utils'
import DefaultHeader from './DefaultHeader.ui'
import WalletSelector from './WalletSelectorConnector'

export default class Body extends Component {
  render () {
    const scene = this.props.routes.scene
    const children = scene.children
    const sceneName = children
      ? this.props.routes.scene.children[this.props.routes.scene.index].name
      : null

    switch (sceneName) {
    case 'scan':
      return <WalletSelector walletList={this.props.walletList}
        toggleFunction='_onPressToggleSelectedWalletModal'
        visibleFlag='selectedWalletListModalVisibility' style={b()} />

    case 'request':
      return <WalletSelector wallets={this.props.walletList}
        toggleFunction='_onPressToggleSelectedWalletModal'
        visibleFlag='selectedWalletListModalVisibility' />

    case 'transactionList':
      return <WalletSelector wallets={this.props.walletList}
        toggleFunction='_onPressToggleSelectedWalletModal'
        visibleFlag='selectedWalletListModalVisibility' />

    case 'sendConfirmation':
      return <WalletSelector wallets={this.props.walletList}
        toggleFunction='_onPressToggleSelectedWalletModal'
        visibleFlag='selectedWalletListModalVisibility' />

    default:
      return <DefaultHeader routes={this.props.routes} />
    }
  }
}
