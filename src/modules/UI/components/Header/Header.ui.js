// @ flow
import React, {Component} from 'react'
import {border as b} from '../../../utils'
import WalletSelector from './Component/WalletSelectorConnector'

type Props ={}

export default class Header extends Component<Props> {
  render () {
    return (
      <WalletSelector toggleFunction='_onPressToggleSelectedWalletModal' visibleFlag='selectedWalletListModalVisibility' style={b()} />
    )
  }
}
