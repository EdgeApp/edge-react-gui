// @flow

import React, { Component } from 'react'

import * as Constants from '../../../../../../constants/indexConstants'
import s from '../../../../../../locales/strings.js'
import { MenuDropDownStyle } from '../../../../../../styles/indexStyles'
import { MenuDropDown } from '../../../../components/MenuDropDown/MenuDropDown.ui.js'

type Props = {
  walletKey: string,
  executeWalletRowOption: (walletKey: string, option: string) => void
}
type State = {}
export default class WalletListRowOptions extends Component<Props, State> {
  options: Array<{ value: string, label: string }>
  constructor (props: Props) {
    super(props)
    this.state = {
      archiveSyntax: s.strings['fragmet_wallets_list_' + (this.props.archived ? 'restore' : 'archive') + '_title_capitalized']
    }
    this.options = []
    for (const walletOption in Constants.WALLET_OPTIONS) {
      const option = Constants.WALLET_OPTIONS[walletOption]
      if (!option.currencyCode || this.props.currencyCode === option.currencyCode) {
        const temp = {
          value: option.value,
          label: option.label
        }
        this.options.push(temp)
      }
    }
  }

  optionAction = (optionKey: string) => {
    this.props.executeWalletRowOption(this.props.walletKey, optionKey)
  }

  render () {
    const modifiedMenuDropDownStyle = {
      // manually overwrite width
      ...MenuDropDownStyle,
      menuIconWrap: {
        ...MenuDropDownStyle.menuIconWrap,
        width: 46
      }
    }
    return <MenuDropDown style={modifiedMenuDropDownStyle} onSelect={this.optionAction} data={this.options} />
  }
}
