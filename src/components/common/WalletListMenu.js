// @flow

import React, { Component } from 'react'
import { StyleSheet } from 'react-native'
import slowlog from 'react-native-slowlog'
import { sprintf } from 'sprintf-js'

import { type WalletListMenuKey } from '../../actions/WalletListMenuActions.js'
import { WALLET_LIST_MENU } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { MenuDropDown } from '../../modules/UI/components/MenuDropDown/MenuDropDown.ui.js'
import { MenuDropDownStyle } from '../../styles/components/HeaderMenuDropDownStyles.js'
import { scale } from '../../util/scaling.js'

type Props = {
  walletId: string,
  executeWalletRowOption: (walletId: string, option: WalletListMenuKey) => void,
  currencyCode: string,
  customStyles: StyleSheet.Styles
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

export class WalletListMenu extends Component<Props> {
  options: Array<{ value: string, label: string }>

  constructor(props: Props) {
    super(props)
    const { currencyCode } = props

    this.options = []
    for (const option of WALLET_LIST_MENU) {
      const { currencyCodes, label, value } = option
      if (currencyCodes != null && !currencyCodes.includes(currencyCode)) continue

      const temp = { label, value }
      if (option.value === 'split') {
        const splitString = s.strings.string_split_wallet
        const currencyName = currencyCode === 'BTC' ? 'Bitcoin Cash' : 'Bitcoin SV'
        temp.label = sprintf(splitString, currencyName)
      }
      this.options.push(temp)
    }
    slowlog(this, /.*/, global.slowlogOptions)
  }

  optionAction = (optionKey: WalletListMenuKey) => {
    const { walletId, executeWalletRowOption } = this.props
    executeWalletRowOption(walletId, optionKey)
  }

  render() {
    const { customStyles } = this.props
    return <MenuDropDown style={{ ...modifiedMenuDropDownStyle, ...customStyles }} onSelect={this.optionAction} data={this.options} />
  }
}
