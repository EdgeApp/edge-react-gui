import React, {Component} from 'react'
import {Text, View} from 'react-native'
import Menu, {MenuOptions, MenuOption, MenuTrigger} from 'react-native-menu'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default'

const CHANGE_MINING_FEE_TEXT = sprintf(strings.enUS['change_mining_fee_title'])
const CHANGE_CURRENCY_TEXT = 'Change Currency'
const SEND_MAX_TEXT = sprintf(strings.enUS['send_confirmation_max_button_title'])
const HELP_TEXT = sprintf(strings.enUS['string_help'])

import styles from './styles'

export default class SendConfirmationOptions extends Component {
  handleMenuOptions (key) {
    switch (key) {
    case 'help':
      return this.props.openHelpModal()
    case 'max':
      return this.props.sendMaxSpend()
    }
  }

  render () {
    return (
      <View>
        <Menu onSelect={(value) => this.handleMenuOptions(value)}>
          <MenuTrigger>
            <Text style={styles.trigger}>
              &#8942;
            </Text>
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.optionContainer}>
            <MenuOption value={1} style={styles.optionRow}>
              <Text style={styles.optionText}>
                {CHANGE_MINING_FEE_TEXT}
              </Text>
            </MenuOption>
            <MenuOption value={2} style={styles.optionRow}>
              <Text style={styles.optionText}>
                {CHANGE_CURRENCY_TEXT}
              </Text>
            </MenuOption>
            <MenuOption value='max' style={styles.optionRow}>
              <Text style={[styles.optionText, styles.maxSpend]}>
                {SEND_MAX_TEXT}
              </Text>
            </MenuOption>
            <MenuOption value='help' style={styles.optionRow}>
              <Text style={styles.optionText}>
                {HELP_TEXT}
              </Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}
