import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './style'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import T from '../../components/FormattedText'
import {updateRenameWalletInput} from './action'
import strings from '../../../../locales/default'
import {border as b} from '../../../utils.js'
import {sprintf} from 'sprintf-js'

export const options = [
  {
    value: 'rename',
    syntax: sprintf(strings.enUS['string_rename'])
  },{
    value: 'sort',
    syntax: sprintf(strings.enUS['fragment_wallets_sort'])
  },{
    value: 'addToken',
    syntax: sprintf(strings.enUS['fragmet_wallets_addtoken_option'])
  },{
    value: 'archive'
  },{
    value: 'delete',
    syntax: sprintf(strings.enUS['string_delete'])
  }
]

class WalletListRowOptions extends Component {
  constructor(props) {
    super(props)
    this.state = {
      archiveSyntax: sprintf(strings.enUS['fragmet_wallets_list_' + (this.props.archived ? 'restore' : 'archive') + '_title_capitalized'])
    }
  }

  optionAction (optionKey) {
    this.props.executeWalletRowOption(this.props.walletKey, optionKey, this.props.wallets, this.props.archives)
    if (optionKey === 'Rename') {
      this.props.dispatch(updateRenameWalletInput(this.props.wallets[this.props.walletKey].name))
    }
  }

  render () {
    // possibly refactor MenuOptions into component that gets looped. Properties could be put into array form
    return (
      <View style={[styles.rowDotsWrap, b()]}>
        <Menu style={[styles.menuButton, b()]} onSelect={(value) => this.optionAction(value)}>
          <MenuTrigger style={[styles.menuTrigger, b()]}>
            <Text style={{fontSize: 20}}>
              &#8942;
            </Text>
          </MenuTrigger>
          <MenuOptions>
            <MenuOption value={options[0].value} style={styles.menuOption}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>{options[0].syntax}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[1].value} style={styles.menuOption}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>{options[1].syntax}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[2].value} style={styles.menuOption}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>{options[2].syntax}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[3].value} style={styles.menuOption}>
              <View style={[styles.menuOptionItem]}>
                {/* <EvilIcons name='archive' size={24} style={[styles.optionIcon, styles.archive]} /> */}
                <T style={[styles.optionText]}>{this.state.archiveSyntax}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[4].value} style={styles.menuOption}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>{options[4].syntax}</T>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}

export default connect(state => ({
  wallets: state.ui.wallets.byId,
  archives: state.ui.wallets.archives
}))(WalletListRowOptions)
