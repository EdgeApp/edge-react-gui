// @flow

import React, { Component } from 'react'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../../../../../constants/indexConstants'
import { scale } from '../../../../../../lib/scaling.js'
import { MenuDropDownStyle } from '../../../../../../styles/indexStyles'
import { MenuDropDown } from '../../../../components/MenuDropDown/MenuDropDown.ui.js'

type Props = {
  walletKey: string,
  executeWalletRowOption: (walletKey: string, option: string) => void,
  currencyCode: Array<string>
}

const modifiedMenuDropDownStyle = {
  // manually overwrite width
  ...MenuDropDownStyle,
  menuIconWrap: {
    ...MenuDropDownStyle.menuIconWrap,
    width: scale(46)
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
