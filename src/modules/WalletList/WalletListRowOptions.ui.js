import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import styles from './WalletList.style'
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import {executeWalletRowOption, updateCurrentWalletBeingRenamed, updateWalletRenameInput } from './WalletList.action'

class WalletListRowOptions extends Component {

  constructor (props) {
    super(props)
  }

  optionAction (optionKey) {
    this.props.dispatch(executeWalletRowOption(this.props.walletKey, optionKey, this.props.wallets, this.props.archives))
    if (optionKey === 'Rename') {
      this.props.dispatch(updateCurrentWalletBeingRenamed(this.props.walletKey))
      this.props.dispatch(updateWalletRenameInput(this.props.wallets[this.props.walletKey].name))
    }
  }

  render () {
    const options = ['Rename', 'Add Token', this.props.archiveLabel, 'Delete']

    return (
      <View style={{ padding: 10, flexDirection: 'row' }} style={styles.rowDotsWrap}>
        <Menu onSelect={(value) => this.optionAction(value)}>
          <MenuTrigger>
            <Text style={{ fontSize: 20 }}>&#8942;</Text>
          </MenuTrigger>
          <MenuOptions>
            <MenuOption value={options[0]}>
              <Text>{options[0]}</Text>
            </MenuOption>
            <MenuOption value={options[1]}>
              <Text>{options[1]}</Text>
            </MenuOption>
            <MenuOption value={options[2]}>
              <Text>{options[2]}</Text>
            </MenuOption>
            <MenuOption value={options[3]}>
              <Text>{options[3]}</Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}

export default connect(state => ({
  wallets: state.ui.wallets.wallets,
  archives: state.ui.wallets.archives
}))(WalletListRowOptions)
