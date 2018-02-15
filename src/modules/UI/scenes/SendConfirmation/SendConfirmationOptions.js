// @flow

import type { EdgeCurrencyWallet } from 'edge-login'
import React, { Component } from 'react'
import { Text, View } from 'react-native'
import Menu, { MenuOption, MenuOptions, MenuTrigger } from 'react-native-menu'

import s from '../../../../locales/strings.js'
import { border } from '../../../utils'
import styles from './styles'

const CHANGE_MINING_FEE_TEXT = s.strings.title_change_mining_fee
const CHANGE_CURRENCY_TEXT = s.strings.change_currency_fee
const SEND_MAX_TEXT = s.strings.send_confirmation_max_button_title
const HELP_TEXT = s.strings.string_help

const CHANGE_MINING_FEE = 'CHANGE_MINING_FEE'
const CHANGE_CURRENCY = 'CHANGE_CURRENCY'
const SEND_MAX = 'SEND_MAX'
const HELP = 'HELP'

type Props = {
  changeMiningFee: EdgeCurrencyWallet => void,
  openHelpModal: () => void,
  sendMaxSpend: () => void,
  sourceWallet: EdgeCurrencyWallet
}
type State = {}
export default class SendConfirmationOptions extends Component<Props, State> {
  handleMenuOptions (key: string) {
    switch (key) {
      case CHANGE_MINING_FEE:
        return this.props.changeMiningFee(this.props.sourceWallet)
      case HELP:
        return this.props.openHelpModal()
      case SEND_MAX:
        return this.props.sendMaxSpend()
    }
  }

  render () {
    return (
      <View>
        <Menu onSelect={value => this.handleMenuOptions(value)}>
          <MenuTrigger style={[border(), styles.menuTrigger]}>
            <Text style={[styles.trigger, border()]}>&#8942;</Text>
          </MenuTrigger>
          <MenuOptions optionsContainerStyle={styles.optionContainer}>
            <MenuOption value={CHANGE_MINING_FEE} style={styles.optionRow}>
              <Text style={styles.optionText}>{CHANGE_MINING_FEE_TEXT}</Text>
            </MenuOption>
            <MenuOption value={CHANGE_CURRENCY} style={styles.optionRow}>
              <Text style={styles.optionText}>{CHANGE_CURRENCY_TEXT}</Text>
            </MenuOption>
            <MenuOption value={SEND_MAX} style={styles.optionRow}>
              <Text style={[styles.optionText, styles.maxSpend]}>{SEND_MAX_TEXT}</Text>
            </MenuOption>
            <MenuOption value={HELP} style={styles.optionRow}>
              <Text style={styles.optionText}>{HELP_TEXT}</Text>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}
