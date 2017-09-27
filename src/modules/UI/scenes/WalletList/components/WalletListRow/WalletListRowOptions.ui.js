import React, {Component} from 'react'
import {Text, View} from 'react-native'
import styles from '../../style'
import Menu, {MenuOptions, MenuOption, MenuTrigger} from 'react-native-menu'
import T from '../../../../components/FormattedText/FormattedText.ui'
import strings from '../../../../../../locales/default'

export const options = [
  {
    value: 'rename',
    syntax: strings.enUS['string_rename']
  },{
    value: 'sort',
    syntax: strings.enUS['fragment_wallets_sort']
  },{
    value: 'addToken',
    syntax: strings.enUS['fragmet_wallets_addtoken_option']
  },/*{
    value: 'archive'
  },*/{
    value: 'delete',
    syntax: strings.enUS['string_delete']
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

  optionAction (optionKey) {
    this.props.executeWalletRowOption(this.props.walletKey, optionKey, this.props.wallets, this.props.archives)
    if (optionKey === 'Rename') {
      this.props.updateRenameWalletInput(this.props.wallets[this.props.walletKey].name)
    }
  }

  render () {
    // possibly refactor MenuOptions into component that gets looped. Properties could be put into array form
    return (
      <View style={[styles.rowDotsWrap]}>
        <Menu style={[styles.menuButton]}
          onSelect={(value) => this.optionAction(value)}>

          <MenuTrigger style={[styles.menuTrigger]}>
            <Text style={{fontSize: 20}}>
              &#8942;
            </Text>
          </MenuTrigger>

          <MenuOptions>

            <MenuOption style={styles.menuOption}
              value={options[0].value}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>
                  {options[0].syntax}
                </T>
              </View>
            </MenuOption>

            <MenuOption style={styles.menuOption}
              value={options[1].value}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>
                  {options[1].syntax}
                </T>
              </View>
            </MenuOption>

            <MenuOption style={styles.menuOption}
              value={options[2].value}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>
                  {options[2].syntax}
                </T>
              </View>
            </MenuOption>

            {/*<MenuOption style={styles.menuOption}
              value={options[3].value}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>
                  {this.state.archiveSyntax}
                </T>
              </View>
            </MenuOption>*/}

            <MenuOption style={styles.menuOption}
              value={options[3].value}>
              <View style={[styles.menuOptionItem]}>
                <T style={[styles.optionText]}>
                  {options[3].syntax}
                </T>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}
