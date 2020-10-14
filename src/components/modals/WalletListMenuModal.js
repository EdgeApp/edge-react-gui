// @flow

import React, { PureComponent } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import { connect } from 'react-redux'
import { sprintf } from 'sprintf-js'

import { type WalletListMenuKey, walletListMenuAction } from '../../actions/WalletListMenuActions.js'
import { WALLET_LIST_MENU } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type GuiWallet } from '../../types/types.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
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
  image?: string,
  isToken?: boolean,
  walletId: string,
  walletName?: string
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
    const { bridge, currencyCode, walletName, image, theme } = this.props
    const styles = getStyles(theme)

    // We need to close the gap if both header rows are present:
    const headerRowStyle = walletName != null && (image != null || currencyCode != null) ? [styles.headerRow, { marginTop: theme.rem(-1) }] : styles.headerRow

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleCancel}>
        {walletName == null ? null : <ModalTitle>{walletName}</ModalTitle>}
        <View style={headerRowStyle}>
          {image == null ? null : <Image resizeMode="cover" source={{ uri: image }} style={styles.currencyImage} />}
          {currencyCode == null ? null : <ModalTitle>{currencyCode}</ModalTitle>}
        </View>
        {this.options.map((option: Option) => (
          <TouchableOpacity key={option.value} onPress={() => this.optionAction(option.value)} style={styles.optionRow}>
            <AntDesignIcon
              name={icons[option.value]}
              size={theme.rem(1)}
              style={option.value === 'delete' ? [styles.optionIcon, styles.warningColor] : styles.optionIcon}
            />
            <Text style={option.value === 'delete' ? [styles.optionText, styles.warningColor] : styles.optionText}>{option.label}</Text>
          </TouchableOpacity>
        ))}
        <ModalCloseArrow onPress={this.handleCancel} />
      </ThemedModal>
    )
  }

  handleCancel = () => {
    const { bridge } = this.props
    bridge.resolve(null)
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  currencyImage: {
    width: theme.rem(1),
    height: theme.rem(1),
    padding: theme.rem(0.5)
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row'
  },
  optionIcon: {
    color: theme.primaryText,
    padding: theme.rem(0.5)
  },
  optionText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    padding: theme.rem(0.5)
  },
  warningColor: {
    color: theme.warningText
  }
}))

export const WalletListMenuModal = connect(
  (state: RootState): StateProps => ({ wallets: state.ui.wallets.byId }),
  (dispatch: Dispatch): DispatchProps => ({
    walletListMenuAction(walletId, option, currencyCode) {
      dispatch(walletListMenuAction(walletId, option, currencyCode))
    }
  })
)(withTheme(WalletListMenuModalComponent))
