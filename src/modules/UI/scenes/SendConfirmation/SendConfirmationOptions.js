import React, {Component} from 'react'
import {Text, View} from 'react-native'
import Menu, {MenuOptions, MenuOption, MenuTrigger} from 'react-native-menu'
import {sprintf} from 'sprintf-js'
import strings from '../../../../locales/default'
import {border} from '../../../utils'


const CHANGE_MINING_FEE_TEXT = sprintf(strings.enUS['change_mining_fee_title'])
const CHANGE_CURRENCY_TEXT = 'Change Currency'
const SEND_MAX_TEXT = sprintf(strings.enUS['send_confirmation_max_button_title'])
const HELP_TEXT = sprintf(strings.enUS['string_help'])

const CHANGE_MINING_FEE = 'CHANGE_MINING_FEE'
const CHANGE_CURRENCY = 'CHANGE_CURRENCY'
const SEND_MAX = 'SEND_MAX'
const HELP = 'HELP'

import styles from './styles'

export default class SendConfirmationOptions extends Component {
  handleMenuOptions (key) {
    switch (key) {
    case CHANGE_MINING_FEE:
      return this.props.changeMiningFee()
    case HELP:
      return this.props.openHelpModal()
    case SEND_MAX:
      return this.props.sendMaxSpend()
    }
  }

  render () {
    return (
      <View>
        <Menu onSelect={(value) => this.handleMenuOptions(value)}>
          <MenuTrigger style={[border(), styles.menuTrigger]} >
            <Text style={[styles.trigger, border()]} >
              &#8942;
            </Text>
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.optionContainer}>
            <MenuOption value={CHANGE_MINING_FEE} style={styles.optionRow}>
              <Text style={styles.optionText}>
                {CHANGE_MINING_FEE_TEXT}
              </Text>
            </MenuOption>
            <MenuOption value={CHANGE_CURRENCY} style={styles.optionRow}>
              <Text style={styles.optionText}>
                {CHANGE_CURRENCY_TEXT}
              </Text>
            </MenuOption>
            <MenuOption value={SEND_MAX} style={styles.optionRow}>
              <Text style={[styles.optionText, styles.maxSpend]}>
                {SEND_MAX_TEXT}
              </Text>
            </MenuOption>
            <MenuOption value={HELP} style={styles.optionRow}>
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
