// @flow

import React, { Component } from 'react'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../constants/indexConstants'
import { scale } from '../../lib/scaling.js'
import { MenuDropDown } from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui.js'
import { MenuDropDownStyle } from '../../styles/indexStyles'

type Props = {
  walletKey: string,
  executeWalletRowOption: (walletKey: string, option: string) => void,
  currencyCode: Array<string>
}

const modifiedMenuDropDownStyle = {
  // manually overwrite width
  ...MenuDropDownStyle,
  icon: {
    ...MenuDropDownStyle.icon,
    fontSize: scale(30),
    position: 'relative',
    top: 2
  }
}

export default class WalletListRowOptions extends Component<Props> {
  options: Array<{ value: string, label: string }>
  constructor (props: Props) {
    super(props)

    this.options = []
    for (const walletOption in Constants.WALLET_OPTIONS) {
      const option = Constants.WALLET_OPTIONS[walletOption]
      if (!option.currencyCode || option.currencyCode.includes(this.props.currencyCode)) {
        const temp = {
          value: option.value,
          label: option.label
        }
        this.options.push(temp)
      }
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  optionAction = (optionKey: string) => {
    this.props.executeWalletRowOption(this.props.walletKey, optionKey)
  }

  render () {
    return <MenuDropDown style={modifiedMenuDropDownStyle} onSelect={this.optionAction} data={this.options} />
  }
}
