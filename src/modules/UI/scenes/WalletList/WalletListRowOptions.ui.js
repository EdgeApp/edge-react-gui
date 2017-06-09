import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Text, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import styles from './style'
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import FormattedText from '../../components/FormattedText'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import EvilIcon from 'react-native-vector-icons/EvilIcons'
import {executeWalletRowOption, updateCurrentWalletBeingRenamed, updateRenameWalletInput } from './action'

class WalletListRowOptions extends Component {

  constructor (props) {
    super(props)
  }

  optionAction (optionKey) {
    console.log('this.props', this.props)
    console.log('optionKey', optionKey)
    this.props.dispatch(executeWalletRowOption(this.props.walletKey, optionKey, this.props.wallets, this.props.archives))
    if (optionKey === 'Rename') {
      this.props.dispatch(updateRenameWalletInput(this.props.wallets[this.props.walletKey].id.slice(0, 5)))
    }
  }

  render () {
    const options = ['Rename', 'Add Token', this.props.archiveLabel, 'Delete']

    // possibly refactor MenuOptions into component that gets looped. Properties could be put into array form
    return (
      <View style={{ padding: 10, flexDirection: 'row' }} style={styles.rowDotsWrap}>
        <Menu onSelect={(value) => this.optionAction(value)}>
          <MenuTrigger>
            <Text style={{fontSize: 20 }}>&#8942;</Text>
          </MenuTrigger>
          <MenuOptions>
            <MenuOption value={options[0]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, this.border('green')]}>
                <MAIcon name='edit' size={24} style={[styles.optionIcon, styles.editIcon, this.border('red')]} />
                <FormattedText style={[styles.optionText]}>{options[0]}</FormattedText>
              </View>
            </MenuOption>
            <MenuOption value={options[1]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, this.border('green')]}>
                <MAIcon name='edit' size={24} style={[styles.optionIcon, styles.editIcon, this.border('red')]} />
                <FormattedText style={[styles.optionText]}>{options[1]}</FormattedText>
              </View>
            </MenuOption>
            <MenuOption value={options[2]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, this.border('green')]}>
                <EvilIcon name='archive' size={24} style={[styles.optionIcon, styles.archive, this.border('red')]} />
                <FormattedText style={[styles.optionText]}>{options[2]}</FormattedText>
              </View>
            </MenuOption>
            <MenuOption value={options[3]} style={styles.menuOption}>
              <View style={[styles.menuOptionItem, this.border('green')]}>
                <FAIcon name='trash-o' size={24} style={[styles.optionIcon, styles.trashIcon, this.border('red')]} />
                <FormattedText style={[styles.optionText]}>{options[3]}</FormattedText>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }
}

export default connect(state => ({
  wallets: state.ui.wallets.byId,
  archives: state.ui.wallets.archives
}))(WalletListRowOptions)
