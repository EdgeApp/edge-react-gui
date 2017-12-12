import React, {Component} from 'react'
import * as Constants from '../../../../../../constants/indexConstants'
import strings from '../../../../../../locales/default'
import MenuDropDown from '../../../../components/MenuDropDown/MenuDropDown.ui'
import {MenuDropDownStyle} from '../../../../../../styles/indexStyles'
export const options = [
  {
    value: Constants.RENAME_VALUE,
    label: strings.enUS['string_rename']
  },{
    value: Constants.SORT_VALUE,
    label: strings.enUS['fragment_wallets_sort']
  },{
    value: Constants.DELETE_VALUE,
    label: strings.enUS['string_delete']
  },{
    value: Constants.MANAGE_TOKENS_VALUE,
    label: strings.enUS['fragmet_wallets_managetokens_option']
  }
]

export default class WalletListRowOptions extends Component {
  constructor (props) {
    super(props)
    this.state = {
      archiveSyntax: strings.enUS['fragmet_wallets_list_'
      + (this.props.archived
        ? 'restore'
        : 'archive')
        + '_title_capitalized']
    }
    this.options = (this.props.currencyCode === 'ETH') ? options : options.slice(0, -1)
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
