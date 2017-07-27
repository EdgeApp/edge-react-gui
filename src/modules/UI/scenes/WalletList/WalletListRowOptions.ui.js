import React, { Component } from 'react'
import { Text, View } from 'react-native'
import { connect } from 'react-redux'
import styles from './style'
import Menu, { MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import T from '../../components/FormattedText'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import {executeWalletRowOption, updateRenameWalletInput} from './action'
import {border as b} from '../../../utils'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'

class WalletListRowOptions extends Component {
  optionAction (optionKey) {
    this.props.dispatch(executeWalletRowOption(this.props.walletKey, optionKey, this.props.wallets, this.props.archives))
    if (optionKey === 'Rename') {
      this.props.dispatch(updateRenameWalletInput(this.props.wallets[this.props.walletKey].name))
    }
  }

  render () {
    const options = [sprintf(strings.enUS['string_rename']), sprintf(strings.enUS['fragmet_wallets_addtoken_option']), this.props.archiveLabel, sprintf(strings.enUS['string_delete'])]

    // possibly refactor MenuOptions into component that gets looped. Properties could be put into array form
    return (
      <View style={styles.rowDotsWrap}>
        <Menu style={styles.menuButton} onSelect={(value) => this.optionAction(value)}>
          <MenuTrigger style={styles.menuTrigger}>
            <Text style={{fontSize: 20}}>
              &#8942;
            </Text>
          </MenuTrigger>
          <MenuOptions>
            <MenuOption value={options[0]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, b('green')]}>
                <MAIcon name='edit' size={24} style={[styles.optionIcon, styles.editIcon, b('red')]} />
                <T style={[styles.optionText]}>{options[0]}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[1]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, b('green')]}>
                <MAIcon name='edit' size={24} style={[styles.optionIcon, styles.editIcon, b('red')]} />
                <T style={[styles.optionText]}>{options[1]}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[2]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, b('green')]}>
                {/* <EvilIcons name='archive' size={24} style={[styles.optionIcon, styles.archive, b('red')]} /> */}
                <T style={[styles.optionText]}>{options[2]}</T>
              </View>
            </MenuOption>
            <MenuOption value={options[3]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, b('green')]}>
                <FAIcon name='trash-o' size={24} style={[styles.optionIcon, styles.trashIcon, b('red')]} />
                <T style={[styles.optionText]}>{options[3]}</T>
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
