// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { FlatList, Image, ScrollView, TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { updatePubAddressesForFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/index'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { CryptoExchangeWalletListRowStyle as walletStyles } from '../../styles/components/CryptoExchangeWalletListRowStyle'
import { styles } from '../../styles/scenes/FioConnectWalletStyle'
import type { FioConnectionWalletItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

export type State = {
  selectedToRemove: { [walletId: string]: FioConnectionWalletItem },
  disconnectWalletsLoading: boolean
}

export type FioDisconnectWalletsStateProps = {
  ccWalletMap: CcWalletMap,
  connectedWallets?: { [walletId: string]: FioConnectionWalletItem },
  isConnected: boolean
}

export type FioDisconnectWalletsDispatchProps = {
  updateConnectedWallets: (fioAddress: string, ccWalletMap: CcWalletMap) => void
}

export type FioDisconnectWalletsRouteProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string
}

type Props = FioDisconnectWalletsStateProps & FioDisconnectWalletsDispatchProps & FioDisconnectWalletsRouteProps

export class FioDisconnectWalletScene extends Component<Props, State> {
  state = {
    selectedToRemove: {},
    disconnectWalletsLoading: false
  }

  confirm = async (): Promise<void> => {
    const { selectedToRemove } = this.state
    const { fioWallet, fioAddressName, updateConnectedWallets, ccWalletMap, isConnected } = this.props
    const newCcWalletMap = { ...ccWalletMap }
    if (isConnected) {
      this.setState({ disconnectWalletsLoading: true })
      try {
        await updatePubAddressesForFioAddress(
          fioWallet,
          fioAddressName,
          Object.keys(selectedToRemove).map((walletKey: string) => {
            newCcWalletMap[selectedToRemove[walletKey].fullCurrencyCode] = ''
            return {
              walletId: selectedToRemove[walletKey].id,
              chainCode: selectedToRemove[walletKey].chainCode,
              tokenCode: selectedToRemove[walletKey].currencyCode,
              publicAddress: '0'
            }
          })
        )
        updateConnectedWallets(fioAddressName, newCcWalletMap)
        showToast(s.strings.fio_disconnect_wallets_success)
        Actions.popTo(Constants.FIO_ADDRESS_DETAILS)
      } catch (e) {
        showError(e.message)
      }
      this.setState({ disconnectWalletsLoading: false })
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  selectWallet (wallet: FioConnectionWalletItem): void {
    const { selectedToRemove } = this.state
    if (selectedToRemove[wallet.key]) {
      delete selectedToRemove[wallet.key]
    } else {
      selectedToRemove[wallet.key] = wallet
    }

    this.setState({ selectedToRemove })
  }

  keyExtractor = (item: {}, index: number): string => index.toString()

  renderWalletItem = ({ item: wallet }: { item: FioConnectionWalletItem }) => {
    const { selectedToRemove } = this.state
    if (wallet) {
      const isSelected = !!selectedToRemove[wallet.key]

      return (
        <TouchableHighlight
          style={isSelected ? styles.walletSelected : styles.wallet}
          underlayColor={styles.underlay.color}
          onPress={() => this.selectWallet(wallet)}
        >
          <View style={walletStyles.rowContainerTop}>
            <View style={walletStyles.containerLeft}>
              {wallet.symbolImage ? <Image style={walletStyles.imageContainer} source={{ uri: wallet.symbolImage }} resizeMode={'contain'} /> : <T>-</T>}
            </View>
            <View style={styles.walletDetailsContainer}>
              <View style={styles.walletDetailsCol}>
                <T style={[styles.walletDetailsRowCurrency]}>{wallet.currencyCode}</T>
                <T style={[styles.walletDetailsRowName]}>{wallet.name}</T>
              </View>
              <View style={styles.walletDetailsCol}>
                <T style={[walletStyles.walletDetailsRowFiat]}>{isSelected ? s.strings.fio_wallet_connect_return : s.strings.fio_wallet_connect_remove}</T>
              </View>
            </View>
          </View>
        </TouchableHighlight>
      )
    }
    return null
  }

  render () {
    const { connectedWallets } = this.props
    const { selectedToRemove, disconnectWalletsLoading } = this.state

    if (!connectedWallets || !Object.keys(connectedWallets).length) {
      return (
        <SceneWrapper background="body">
          <ScrollView style={styles.list}>
            <T style={styles.no_wallets_text}>{s.strings.fio_connect_no_wallets}</T>
          </ScrollView>
        </SceneWrapper>
      )
    }

    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.list}>
          <FlatList
            data={Object.values(connectedWallets)}
            contentContainerStyle={styles.contentStyles}
            initialNumToRender={24}
            keyboardShouldPersistTaps="handled"
            keyExtractor={this.keyExtractor}
            renderItem={this.renderWalletItem}
          />
        </ScrollView>
        <View style={[styles.bottomSection, styles.bottomSectionBlue]}>
          <ABSlider
            forceUpdateGuiCounter={false}
            resetSlider={true}
            onSlidingComplete={this.confirm}
            sliderDisabled={!Object.keys(selectedToRemove).length}
            disabledText={s.strings.send_confirmation_slide_to_confirm}
            showSpinner={disconnectWalletsLoading}
          />
        </View>
      </SceneWrapper>
    )
  }
}
