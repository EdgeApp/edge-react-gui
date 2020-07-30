// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Keyboard, StyleSheet, View } from 'react-native'
import Menu, { MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu'

import { getSpecialCurrencyInfo } from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { scale } from '../../util/scaling.js'
import { showHelpModal } from '../modals/HelpModal.js'

const CHANGE_MINING_FEE = 'CHANGE_MINING_FEE'
const SEND_MAX = 'SEND_MAX'
const HELP = 'HELP'
const ADD_UNIQUE_IDENTIFIER = 'ADD_UNIQUE_IDENTIFIER'

type Option = 'CHANGE_MINING_FEE' | 'SEND_MAX' | 'HELP' | 'ADD_UNIQUE_IDENTIFIER'
type Props = {
  changeMiningFee: EdgeCurrencyWallet => void,
  sendMaxSpend: () => void,
  uniqueIdentifierModalActivated: () => void,
  sourceWallet: EdgeCurrencyWallet,
  currencyCode: string,
  isEditable: boolean
}

export default class SendConfirmationOptions extends React.Component<Props> {
  handleMenuOptions(key: Option | string) {
    switch (key) {
      case CHANGE_MINING_FEE:
        return this.props.changeMiningFee(this.props.sourceWallet)
      case HELP:
        return showHelpModal()
      case SEND_MAX:
        return this.props.sendMaxSpend()
      case ADD_UNIQUE_IDENTIFIER:
        return this.props.uniqueIdentifierModalActivated()
      default:
        return null
    }
  }

  render() {
    const { currencyCode, isEditable } = this.props
    return (
      <View>
        <Menu onSelect={value => this.handleMenuOptions(value)} onOpen={() => Keyboard.dismiss()}>
          <MenuTrigger style={styles.menuTrigger}>
            <Text style={styles.trigger}>&#8942;</Text>
          </MenuTrigger>

          <MenuOptions optionsContainerStyle={styles.optionContainer}>
            {!getSpecialCurrencyInfo(currencyCode).noChangeMiningFee && (
              <MenuOption value={CHANGE_MINING_FEE} style={styles.menuOption}>
                <View style={styles.menuOptionItem}>
                  <Text style={styles.optionText}>{s.strings.title_change_mining_fee}</Text>
                </View>
              </MenuOption>
            )}

            {isEditable && !getSpecialCurrencyInfo(currencyCode).noMaxSpend && (
              <MenuOption value={SEND_MAX} style={styles.menuOption}>
                <View style={styles.menuOptionItem}>
                  <Text style={[styles.optionText, styles.maxSpend]}>{s.strings.send_confirmation_max_button_title}</Text>
                </View>
              </MenuOption>
            )}

            {!!getSpecialCurrencyInfo(currencyCode).uniqueIdentifier && (
              <MenuOption value={ADD_UNIQUE_IDENTIFIER} style={styles.menuOption}>
                <View style={styles.menuOptionItem}>
                  <Text style={styles.optionText}>{getSpecialCurrencyInfo(currencyCode).uniqueIdentifier.addButtonText}</Text>
                </View>
              </MenuOption>
            )}

            <MenuOption value={HELP} style={styles.menuOption}>
              <View style={styles.menuOptionItem}>
                <Text style={styles.optionText}>{s.strings.string_help}</Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
      </View>
    )
  }
}

const rawStyles = {
  menuTrigger: {
    paddingHorizontal: scale(8),
    paddingVertical: scale(4)
  },
  trigger: {
    fontFamily: THEME.FONTS.BOLD,
    fontSize: scale(18),
    color: THEME.COLORS.WHITE,
    paddingHorizontal: scale(8)
  },
  optionContainer: {
    width: scale(165)
  },
  maxSpend: {
    color: THEME.COLORS.ACCENT_ORANGE
  },

  menuOption: {
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    justifyContent: 'center'
  },
  menuOptionItem: {
    flexDirection: 'row',
    paddingVertical: scale(4),
    paddingHorizontal: scale(6)
  },
  optionText: {
    color: THEME.COLORS.GRAY_1,
    fontSize: scale(18)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
