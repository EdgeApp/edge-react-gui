// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, FlatList, Image, ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/SceneKeys'
import s from '../../locales/strings.js'
import { findWalletByFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletListRowStyle as walletStyles } from '../../styles/components/CryptoExchangeWalletListRowStyle'
import { styles } from '../../styles/scenes/FioConnectWalletStyle'
import type { FioConnectionWalletItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'

export type State = {
  selectedWalletsMap: { [walletId: string]: FioConnectionWalletItem },
  fioWallet: EdgeCurrencyWallet | null,
  fioWalletLoading: boolean
}

export type FioConnectWalletStateProps = {
  notConnectedWallets?: { [key: string]: FioConnectionWalletItem },
  fioWallets: EdgeCurrencyWallet[],
  loading: boolean
}

export type FioConnectWalletRouteProps = {
  fioAddressName: string
}

type Props = FioConnectWalletStateProps & FioConnectWalletRouteProps

export class FioConnectWalletScene extends Component<Props, State> {
  state = {
    selectedWalletsMap: {},
    fioWallet: null,
    fioWalletLoading: false
  }

  componentDidMount (): void {
    this.findFioWallet()
  }

  findFioWallet = async () => {
    const { fioAddressName, fioWallets } = this.props
    this.setState({ fioWalletLoading: true })
    const fioWallet = await findWalletByFioAddress(fioWallets, fioAddressName)
    this.setState({ fioWalletLoading: false, fioWallet })
  }

  _onContinuePress = async (): Promise<void> => {
    const { fioAddressName } = this.props
    const { selectedWalletsMap, fioWallet } = this.state
    if (fioWallet) {
      Actions[Constants.FIO_CONNECT_TO_WALLETS_CONFIRM]({ fioAddressName, fioWallet, selectedWallets: Object.values(selectedWalletsMap) })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  _onShowConnectedPress = async (): Promise<void> => {
    const { fioAddressName } = this.props
    const { fioWallet } = this.state
    if (fioWallet) {
      Actions[Constants.FIO_ADDRESS_DISCONNECT_WALLETS]({ fioAddressName, fioWallet })
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  selectWallet (wallet: FioConnectionWalletItem): void {
    const { selectedWalletsMap } = this.state
    if (selectedWalletsMap[wallet.key]) {
      delete selectedWalletsMap[wallet.key]
    } else {
      if (Object.keys(selectedWalletsMap).length > 4) {
        showError(s.strings.fio_connect_only_5_per_once)
        return
      }
      selectedWalletsMap[wallet.key] = wallet
    }

    this.setState({ selectedWalletsMap })
  }

  keyExtractor = (item: {}, index: number): string => index.toString()

  renderFioConnectionWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    const { selectedWalletsMap } = this.state
    if (wallet) {
      const isSelected = !!selectedWalletsMap[wallet.key]
      const disabled =
        !isSelected &&
        !!Object.keys(selectedWalletsMap).find((walletItemKey: string) => selectedWalletsMap[walletItemKey].fullCurrencyCode === wallet.fullCurrencyCode)

      return (
        <TouchableHighlight
          style={disabled ? styles.walletDisabled : isSelected ? styles.walletSelected : styles.wallet}
          underlayColor={styles.underlay.color}
          onPress={() => this.selectWallet(wallet)}
          disabled={disabled}
        >
          <View style={walletStyles.rowContainerTop}>
            <View style={walletStyles.containerLeft}>
              <Image style={walletStyles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode={'contain'} />
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsCol}>
                <T style={[styles.walletDetailsRowCurrency]}>{wallet.currencyCode}</T>
                <T style={[styles.walletDetailsRowName]}>{wallet.name}</T>
              </View>
              <View style={styles.walletDetailsCol}>
                <T style={[walletStyles.walletDetailsRowFiat]}>
                  {disabled ? '' : isSelected ? s.strings.fio_wallet_connect_remove : s.strings.fio_wallet_connect_add}
                </T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  renderNoWallets () {
    const { loading } = this.props
    return <T style={styles.no_wallets_text}>{loading ? s.strings.loading : s.strings.fio_connect_no_wallets}</T>
  }

  render () {
    const { notConnectedWallets } = this.props
    const { selectedWalletsMap, fioWalletLoading } = this.state
    const continueDisabled = !Object.keys(selectedWalletsMap).length || Object.keys(selectedWalletsMap).length > 5

    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.list}>
          {notConnectedWallets && Object.keys(notConnectedWallets).length ? (
            <FlatList
              data={Object.values(notConnectedWallets)}
              contentContainerStyle={styles.contentContainer}
              initialNumToRender={24}
              keyboardShouldPersistTaps="handled"
              keyExtractor={this.keyExtractor}
              renderItem={this.renderFioConnectionWalletItem}
            />
          ) : (
            this.renderNoWallets()
          )}
        </ScrollView>
        <View style={styles.bottomSection}>
          <TouchableHighlight
            style={[styles.button, continueDisabled ? styles.btnDisabled : null]}
            onPress={this._onContinuePress}
            underlayColor={styles.btnUnderlay.color}
            disabled={continueDisabled || fioWalletLoading}
          >
            <View style={styles.buttonTextWrap}>
              {fioWalletLoading ? <ActivityIndicator size="small" /> : <T style={styles.buttonText}>{s.strings.legacy_address_modal_continue}</T>}
            </View>
          </TouchableHighlight>
          <TouchableHighlight
            style={[styles.button, styles.connectedBtn]}
            onPress={this._onShowConnectedPress}
            underlayColor={styles.btnDisabled.backgroundColor}
          >
            <View style={styles.buttonTextWrap}>
              <T style={[styles.buttonText, styles.buttonTextBlue]}>{s.strings.fio_show_connected_wallets}</T>
            </View>
          </TouchableHighlight>
        </View>
      </SceneWrapper>
    )
  }
}
