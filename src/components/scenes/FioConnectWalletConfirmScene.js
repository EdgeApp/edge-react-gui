// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { updatePubAddressesForFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/index'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import ABSlider from '../../modules/UI/components/Slider/index.js'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { styles } from '../../styles/scenes/FioConnectWalletStyle'
import type { FioConnectionWalletItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

export type State = {
  acknowledge: boolean,
  connectWalletsLoading: boolean
}

export type FioConnectWalletConfirmStateProps = {
  ccWalletMap: CcWalletMap,
  isConnected: boolean
}

export type FioConnectWalletConfirmRouteProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string,
  selectedWallets: FioConnectionWalletItem[]
}

export type FioConnectWalletConfirmDispatchProps = {
  updateConnectedWallets: (fioAddress: string, ccWalletMap: CcWalletMap) => void
}

type Props = FioConnectWalletConfirmStateProps & FioConnectWalletConfirmDispatchProps & FioConnectWalletConfirmRouteProps

export class FioConnectWalletConfirmScene extends Component<Props, State> {
  state = {
    acknowledge: false,
    connectWalletsLoading: false
  }

  confirm = async (): Promise<void> => {
    const { fioWallet, fioAddressName, selectedWallets, updateConnectedWallets, ccWalletMap, isConnected } = this.props
    if (isConnected) {
      this.setState({ connectWalletsLoading: true })
      const newCcWalletMap = { ...ccWalletMap }
      try {
        await updatePubAddressesForFioAddress(
          fioWallet,
          fioAddressName,
          selectedWallets.map((wallet: FioConnectionWalletItem) => {
            newCcWalletMap[wallet.fullCurrencyCode] = wallet.id
            return {
              walletId: wallet.id,
              tokenCode: wallet.currencyCode,
              chainCode: wallet.chainCode,
              publicAddress: wallet.publicAddress
            }
          })
        )
        updateConnectedWallets(fioAddressName, newCcWalletMap)
        showToast(s.strings.fio_connect_wallets_success)
        Actions.popTo(Constants.FIO_ADDRESS_DETAILS)
      } catch (e) {
        showError(e.message)
      }
      this.setState({ connectWalletsLoading: false })
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  check = (): void => {
    const { acknowledge } = this.state

    this.setState({ acknowledge: !acknowledge })
  }

  render() {
    const { fioAddressName, selectedWallets } = this.props
    const { acknowledge, connectWalletsLoading } = this.state

    return (
      <SceneWrapper>
        <ScrollView>
          <View style={styles.info}>
            <T style={styles.title}>{s.strings.fio_address_register_form_field_label}</T>
            <T style={styles.titleLarge}>{fioAddressName}</T>
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <T style={styles.title}>{s.strings.title_fio_connect_to_wallet}</T>
            <View style={styles.spacer} />
            {selectedWallets.map(wallet => (
              <T key={`${wallet.id}-${wallet.currencyCode}`} style={styles.walletName}>
                {wallet.name} ({wallet.currencyCode})
              </T>
            ))}
          </View>
          <View style={styles.spacer} />
          <View style={styles.spacer} />
          <View style={styles.info}>
            <TouchableWithoutFeedback onPress={this.check}>
              <View style={styles.checkBoxContainer}>
                <View style={styles.checkBox}>
                  {acknowledge && (
                    <Icon
                      style={styles.checkBoxIconOk}
                      type={Constants.MATERIAL_COMMUNITY}
                      name={Constants.CHECK_CIRCLE}
                      size={styles.checkBoxIconOk.fontSize}
                    />
                  )}
                </View>
                <T style={styles.checkTitle}>{s.strings.fio_connect_checkbox_text}</T>
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <ABSlider
              forceUpdateGuiCounter={false}
              resetSlider
              onSlidingComplete={this.confirm}
              sliderDisabled={!acknowledge}
              disabledText={s.strings.send_confirmation_slide_to_confirm}
              showSpinner={connectWalletsLoading}
            />
            <View style={styles.spacer} />
            <View style={styles.spacer} />
          </View>
        </ScrollView>
      </SceneWrapper>
    )
  }
}
