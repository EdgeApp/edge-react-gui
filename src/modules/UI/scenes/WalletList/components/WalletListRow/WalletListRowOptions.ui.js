import React, {Component} from 'react'
import * as Constants from '../../../../../../constants/indexConstants'
import s from '../../../../../../locales/strings.js'
import MenuDropDown from '../../../../components/MenuDropDown/MenuDropDown.ui'
import {MenuDropDownStyle} from '../../../../../../styles/indexStyles'
export const options = [
  {
    value: Constants.RENAME_VALUE,
    label: s.strings.string_rename
  }, {
    value: Constants.SORT_VALUE,
    label: s.strings.fragment_wallets_sort
  }, {
    value: Constants.DELETE_VALUE,
    label: s.strings.string_delete
  }, {
    value: Constants.RESYNC_VALUE,
    label: s.strings.string_resync
  }
]

export default class WalletListRowOptions extends Component {
  constructor (props) {
    super(props)
    this.options = options
    this.state = {
      archiveSyntax: s.strings['fragmet_wallets_list_' + (this.props.archived ? 'restore' : 'archive') + '_title_capitalized']
    }
    if (this.props.currencyCode === 'ETH') {
      this.options = this.options.concat([{
        value: Constants.MANAGE_TOKENS_VALUE,
        label: s.strings.fragmet_wallets_managetokens_option
      }])
    }
    if (this.props.currencyCode === 'BTC') {
      this.options = this.options.concat([{
        value: Constants.SPLIT_VALUE,
        label: s.strings.string_split
      }])
    }
  }

  optionAction = (optionKey) => {
    this.props.executeWalletRowOption(this.props.walletKey, optionKey)
  }

  render () {
    return (
      <MenuDropDown style={MenuDropDownStyle}
        onSelect={this.optionAction}
        data={this.options} />
    )
  }
}
