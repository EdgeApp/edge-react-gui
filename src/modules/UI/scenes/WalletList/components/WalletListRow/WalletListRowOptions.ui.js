// @flow

import React, { Component } from 'react'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'
import * as ACCOUNT_API from '../../../../../Core/Account/api'
import * as Constants from '../../../../../../constants/indexConstants'
import { MenuDropDownStyle } from '../../../../../../styles/indexStyles'
import { MenuDropDown } from '../../../../components/MenuDropDown/MenuDropDown.ui.js'

type Props = {
  walletId: string,
  account: Array<string>,
  executeWalletRowOption: (walletId: string, option: string) => void,
  currencyCode: string
}

const modifiedMenuDropDownStyle = {
  // manually overwrite width
  ...MenuDropDownStyle,
  menuIconWrap: {
    ...MenuDropDownStyle.menuIconWrap,
    width: 46
  }
}

export default class WalletListRowOptions extends Component<Props> {
  options: Array<{ value: string, label: string }>
  constructor (props: Props) {
    super(props)
    const { account, walletId } = props
    this.options = []
    for (const walletOption in Constants.WALLET_OPTIONS) {
      const option = Constants.WALLET_OPTIONS[walletOption]
      if (walletOption === 'SPLIT') {
        ACCOUNT_API.listSplittableWalletTypes(account, walletId).forEach(walletType => {
          this.options.push({
            value: `${option.value}-${walletType}`,
            label: sprintf(option.label, walletType.replace('wallet:', ''))
          })
        })
      } else if (!option.currencyCode || option.currencyCode.includes(this.props.currencyCode)) {
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
    this.props.executeWalletRowOption(this.props.walletId, optionKey)
  }

  render () {
    return <MenuDropDown style={modifiedMenuDropDownStyle} onSelect={this.optionAction} data={this.options} />
  }
}
