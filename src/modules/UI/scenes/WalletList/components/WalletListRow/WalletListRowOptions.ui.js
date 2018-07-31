// @flow

import React, { Component } from 'react'
import { MenuDropDownStyle } from '../../../../../../styles/indexStyles'
import { MenuDropDown } from '../../../../components/MenuDropDown/MenuDropDown.ui.js'
import type { WalletDropdownOption } from '../../../../../../types.js'

export type WalletListRowOptionsOwnProps = {
  walletId: string,
  executeWalletRowOption: (walletId: string, option: string) => void,
  currencyCode: string,
}

export type WalletListRowOptionsStateProps = {
  account: Array<string>,
  options: Array<WalletDropdownOption>
}

export type WalletListRowOptionsProps = WalletListRowOptionsOwnProps & WalletListRowOptionsStateProps

const modifiedMenuDropDownStyle = {
  // manually overwrite width
  ...MenuDropDownStyle,
  menuIconWrap: {
    ...MenuDropDownStyle.menuIconWrap,
    width: 46
  }
}

export default class WalletListRowOptions extends Component<WalletListRowOptionsProps> {
  optionAction = (optionKey: string) => {
    this.props.executeWalletRowOption(this.props.walletId, optionKey)
  }

  render () {
    return <MenuDropDown style={modifiedMenuDropDownStyle} onSelect={this.optionAction} data={this.props.options} />
  }
}
