import React, {Component} from 'react'
// import {Text, View} from 'react-native'
//import styles from '../../style'
// import Menu, {MenuOptions, MenuOption, MenuTrigger} from 'react-native-menu'
// import T from '../../../../components/FormattedText/FormattedText.ui'
import strings from '../../../../../../locales/default'
import MenuDropDown from '../../../../components/MenuDropDown/MenuDropDown.ui'
import {MenuDropDownStyle} from '../../../../../../styles/indexStyles'
export const options = [
  {
    value: 'rename',
    label: strings.enUS['string_rename']
  },{
    value: 'sort',
    label: strings.enUS['fragment_wallets_sort']
  },{
    value: 'addToken',
    label: strings.enUS['fragmet_wallets_addtoken_option']
  },/*{
    value: 'archive'
  },*/{
    value: 'delete',
    label: strings.enUS['string_delete']
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
  }

  optionAction = (optionKey) => {
    this.props.executeWalletRowOption(this.props.walletKey, optionKey, this.props.wallets, this.props.archives)
    if (optionKey === 'Rename') {
      this.props.updateRenameWalletInput(this.props.wallets[this.props.walletKey].name)
    }
  }

  render () {
    return (
      <MenuDropDown style={MenuDropDownStyle}
        onSelect={this.optionAction}
        data={options} />
    )
  }
}
