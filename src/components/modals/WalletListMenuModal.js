// @flow

import React, { PureComponent } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { type WalletListMenuKey, walletListMenuAction } from '../../actions/WalletListMenuActions.js'
import { WALLET_LIST_MENU } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type Dispatch, type State as ReduxState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ThemedModal } from '../themed/ThemedModal.js'
import { type AirshipBridge } from './modalParts'

type Option = {
  value: WalletListMenuKey,
  label: string
}

type StateProps = {
  wallets: { [walletId: string]: GuiWallet }
}

type OwnProps = {
  bridge: AirshipBridge<null>,
  currencyCode?: string,
  currencyName?: string,
  image?: string,
  isToken?: boolean,
  walletId: string
}

type DispatchProps = {
  walletListMenuAction(walletId: string, option: WalletListMenuKey, currencyCode?: string): void
}

type Props = StateProps & OwnProps & DispatchProps & ThemeProps

const icons = {
  delete: 'warning',
  exportWalletTransactions: 'export',
  getRawKeys: 'lock',
  getSeed: 'key',
  manageTokens: 'plus',
  rename: 'edit',
  resync: 'sync',
  split: 'arrowsalt',
  viewXPub: 'eye'
}

class WalletListMenuModalComponent extends PureComponent<Props> {
  options: Option[]

  constructor(props: Props) {
    super(props)
    const { currencyCode, isToken } = props

    this.options = []

    // Non main wallet options
    if (!currencyCode) {
      this.options.push({
        label: s.strings.string_get_raw_keys,
        value: 'getRawKeys'
      })
      return
    }

    if (isToken) {
      this.options.push({
        label: s.strings.fragment_wallets_export_transactions,
        value: 'exportWalletTransactions'
      })
      return
    }

    // Main wallet options
    for (const option of WALLET_LIST_MENU) {
      const { currencyCodes, label, value } = option
      if (currencyCodes != null && !currencyCodes.includes(currencyCode)) continue

      const temp = { label, value }
      if (option.value === 'split') {
        const splitString = s.strings.string_split_wallet
        const currencyName = currencyCode === 'BTC' ? 'Bitcoin Cash' : 'Bitcoin SV'
        temp.label = sprintf(splitString, currencyName)
      }
      this.options.push(temp)
    }
  }

  optionAction = (option: WalletListMenuKey) => {
    const { bridge, currencyCode, walletId } = this.props
    if (currencyCode == null && this.props.wallets[walletId] != null) {
      this.props.walletListMenuAction(walletId, option, this.props.wallets[walletId].currencyCode)
    } else {
      this.props.walletListMenuAction(walletId, option, currencyCode)
    }
    bridge.resolve(null)
  }

  render() {
    const { bridge, currencyCode, currencyName, image, theme } = this.props
    const styles = getStyles(theme)
    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(null)} paddingRem={0}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            {currencyName && <Text style={styles.text}>{currencyName}</Text>}
            {currencyCode && (
              <View style={styles.headerImageContainer}>
                {image && <Image style={styles.currencyImage} source={{ uri: image }} resizeMode="cover" />}
                <Text style={styles.text}>{currencyCode}</Text>
              </View>
            )}
          </View>
          <View>
            {this.options.map((option: Option, index: number) => {
              return (
                <TouchableOpacity onPress={() => this.optionAction(option.value)} key={option.value}>
                  <View style={[styles.optionContainer, this.options.length > index + 1 ? styles.optionMargin : null]}>
                    <AntDesignIcon name={icons[option.value]} size={theme.rem(1)} color={option.value === 'delete' ? theme.warningIcon : theme.icon} />
                    <Text style={[option.value === 'delete' ? styles.warningText : styles.text, styles.optionText]}>{option.label}</Text>
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(1)
  },
  headerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: theme.rem(1)
  },
  text: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceDefault,
    color: theme.primaryText
  },
  warningText: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceDefault,
    color: theme.warningText
  },
  headerImageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  currencyImage: {
    width: theme.rem(1),
    height: theme.rem(1),
    marginRight: theme.rem(0.25)
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  optionMargin: {
    marginBottom: theme.rem(2)
  },
  optionText: {
    marginLeft: theme.rem(1)
  }
}))

export const WalletListMenuModal = connect(
  (state: ReduxState): StateProps => ({ wallets: state.ui.wallets.byId }),
  (dispatch: Dispatch): DispatchProps => ({
    walletListMenuAction(walletId, option, currencyCode) {
      dispatch(walletListMenuAction(walletId, option, currencyCode))
    }
  })
)(withTheme(WalletListMenuModalComponent))
