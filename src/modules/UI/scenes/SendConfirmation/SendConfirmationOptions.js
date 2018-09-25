// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { Keyboard, View } from 'react-native'
import Menu, { MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu'

import s from '../../../../locales/strings.js'
import { MenuDropDownStyle } from '../../../../styles/indexStyles'
import Text from '../../components/FormattedText'
import styles from './styles'

const CHANGE_MINING_FEE_TEXT = s.strings.title_change_mining_fee
const SEND_MAX_TEXT = s.strings.send_confirmation_max_button_title
const HELP_TEXT = s.strings.string_help
const ADD_DESTINATION_TAG_TEXT = s.strings.unique_identifier_dropdown_option_destination_tag
const ADD_PAYMENT_ID_TEXT = s.strings.unique_identifier_dropdown_option_payment_id

const CHANGE_MINING_FEE = 'CHANGE_MINING_FEE'
const SEND_MAX = 'SEND_MAX'
const HELP = 'HELP'
const ADD_UNIQUE_IDENTIFIER = 'ADD_UNIQUE_IDENTIFIER'

type Option = 'CHANGE_MINING_FEE' | 'SEND_MAX' | 'HELP' | 'ADD_UNIQUE_IDENTIFIER'
type Props = {
  changeMiningFee: EdgeCurrencyWallet => void,
  openHelpModal: () => void,
  sendMaxSpend: () => void,
  uniqueIdentifierModalActivated: () => void,
  sourceWallet: EdgeCurrencyWallet,
  currencyCode: string,
  isEditable: boolean
}

export default class SendConfirmationOptions extends Component<Props> {
  handleMenuOptions (key: Option | string) {
    switch (key) {
      case CHANGE_MINING_FEE:
        return this.props.changeMiningFee(this.props.sourceWallet)
      case HELP:
        return this.props.openHelpModal()
      case SEND_MAX:
        return this.props.sendMaxSpend()
      case ADD_UNIQUE_IDENTIFIER:
        return this.props.uniqueIdentifierModalActivated()
      default:
        return null
    }
  }

  render () {
    const defaultMenuStyle = MenuDropDownStyle
    const { currencyCode, isEditable } = this.props
    return (
      <View>
        <Menu onSelect={value => this.handleMenuOptions(value)} onOpen={() => Keyboard.dismiss()}>
          <MenuTrigger style={styles.menuTrigger}>
            <Text style={styles.trigger}>&#8942;</Text>
          </MenuTrigger>

          <MenuOptions optionsContainerStyle={styles.optionContainer}>
            {isEditable && (
              <MenuOption value={CHANGE_MINING_FEE} style={defaultMenuStyle.menuOption}>
                <View style={defaultMenuStyle.menuOptionItem}>
                  <Text style={defaultMenuStyle.optionText}>{CHANGE_MINING_FEE_TEXT}</Text>
                </View>
              </MenuOption>
            )}

            {isEditable &&
              currencyCode !== 'XMR' && (
              <MenuOption value={SEND_MAX} style={defaultMenuStyle.menuOption}>
                <View style={defaultMenuStyle.menuOptionItem}>
                  <Text style={[defaultMenuStyle.optionText, styles.maxSpend]}>{SEND_MAX_TEXT}</Text>
                </View>
              </MenuOption>
            )}

            {currencyCode === 'XMR' && (
              <MenuOption value={ADD_UNIQUE_IDENTIFIER} style={defaultMenuStyle.menuOption}>
                <View style={defaultMenuStyle.menuOptionItem}>
                  <Text style={[defaultMenuStyle.optionText]}>{ADD_PAYMENT_ID_TEXT}</Text>
                </View>
              </MenuOption>
            )}

            {currencyCode === 'XRP' && (
              <MenuOption value={ADD_UNIQUE_IDENTIFIER} style={defaultMenuStyle.menuOption}>
                <View style={defaultMenuStyle.menuOptionItem}>
                  <Text style={[defaultMenuStyle.optionText]}>{ADD_DESTINATION_TAG_TEXT}</Text>
                </View>
              </MenuOption>
            )}

            <MenuOption value={HELP} style={defaultMenuStyle.menuOption}>
              <View style={defaultMenuStyle.menuOptionItem}>
                <Text style={defaultMenuStyle.optionText}>{HELP_TEXT}</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}
