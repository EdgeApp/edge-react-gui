// @flow

import * as React from 'react'
import { Text, View } from 'react-native'
import Menu, { MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu'

import { exchangeMax } from '../../actions/CryptoExchangeActions.js'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { scale } from '../../util/scaling.js'
import { showHelpModal } from '../modals/HelpModal.js'

type StateProps = {
  hasMaxSpend: boolean
}

type DispatchProps = {
  exchangeMax: () => void
}

type Props = StateProps & DispatchProps

class ExchangeDropMenuComponent extends React.Component<Props> {
  handleSelect = (value: 'help' | 'max'): void => {
    const { exchangeMax } = this.props

    switch (value) {
      case 'help':
        showHelpModal()
        break
      case 'max':
        exchangeMax()
        break
    }
  }

  render() {
    const { hasMaxSpend } = this.props

    return (
      <View style={styles.container}>
        <Menu style={styles.menuButton} onSelect={this.handleSelect}>
          <MenuTrigger customStyles={styles.menuTrigger}>
            <View style={styles.menuIconWrap}>
              <Text style={styles.icon}>&#8942;</Text>
            </View>
          </MenuTrigger>
          <MenuOptions>
            {hasMaxSpend ? (
              <MenuOption style={styles.menuOption} value="max">
                <View style={styles.menuOptionItem}>
                  <Text style={styles.optionText}>{s.strings.dropdown_exchange_max_amount}</Text>
                </View>
              </MenuOption>
            ) : null}
            <MenuOption style={styles.menuOption} value="help">
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

const dropdownTriggerWidth = 46

const styles = {
  container: {
    flexDirection: 'column',
    width: scale(dropdownTriggerWidth),
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuButton: {
    width: scale(dropdownTriggerWidth),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuOption: {
    borderBottomColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    justifyContent: 'center'
  },
  menuTrigger: {
    triggerTouchable: {
      underlayColor: THEME.COLORS.TRANSPARENT,
      activeOpacity: 1,
      style: {
        width: scale(dropdownTriggerWidth),
        justifyContent: 'center',
        alignSelf: 'center',
        height: '100%',
        alignItems: 'center'
      }
    },
    menuTriggerUnderlay: {}
  },
  menuIconWrap: {
    width: scale(46),
    height: '100%',
    alignItems: 'center',
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
  },
  icon: {
    fontSize: scale(20),
    color: THEME.COLORS.WHITE
  }
}

export const ExchangeDropMenu = connect<StateProps, DispatchProps, {}>(
  state => {
    const currencyCode = state.cryptoExchange?.fromWallet?.currencyCode
    return {
      hasMaxSpend: currencyCode != null && getSpecialCurrencyInfo(currencyCode).noMaxSpend !== true
    }
  },
  dispatch => ({
    exchangeMax() {
      dispatch(exchangeMax())
    }
  })
)(ExchangeDropMenuComponent)
