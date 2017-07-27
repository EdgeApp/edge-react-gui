import React, { Component } from 'react'
import { Text, View, StyleSheet } from 'react-native'
import { connect } from 'react-redux'
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'

import { openHelpModal } from '../../components/HelpModal/actions.js'

class SendConfirmationOptions extends Component {

  _handleMenuOptions (key) {
    switch (key) {
      case 'help':
        return this.props.dispatch(openHelpModal())
    }
  }

  render () {
    return (
      <View>
        <Menu onSelect={(value) => this._handleMenuOptions(value)}>
          <MenuTrigger>
            <Text style={styles.trigger}>&#8942;</Text>
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.optionContainer}>
            <MenuOption value={1} style={styles.optionRow}>
              <Text style={styles.optionText}>Change Mining Fee</Text>
            </MenuOption>
            <MenuOption value={2} style={styles.optionRow}>
              <Text style={styles.optionText}>Change Currency</Text>
            </MenuOption>
            <MenuOption value={3} style={styles.optionRow}>
              <Text style={[styles.optionText, {color: '#F6A623'}]}>Send Max Amount</Text>
            </MenuOption>
            <MenuOption value='help' style={styles.optionRow}>
              <Text style={styles.optionText}>Help</Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}

export default connect()(SendConfirmationOptions)

const styles = StyleSheet.create({
  trigger: {
    fontSize: 25,
    color: '#FFF',
    fontWeight: '700'
  },
  optionContainer: {
    width: 165
  },
  optionRow: {
    paddingVertical: 17
  },
  optionText: {
    fontSize: 16
  }
})
