import React, {Component} from 'react'
import {border as b} from '../../../utils'
import WalletSelector from './Component/WalletSelectorConnector'

export default class Header extends Component {
  render () {
    return (
      <WalletSelector walletList={this.props.walletList} toggleFunction='_onPressToggleSelectedWalletModal' visibleFlag='selectedWalletListModalVisibility' style={b()} />
    )
  }
}
