// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import s from '../../locales/strings.js'
import { updatePubAddressesForFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import type { FioConnectionWalletItem } from '../../types/types'
import { scale } from '../../util/scaling.js'
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
  walletsToConnect: FioConnectionWalletItem[],
  walletsToDisconnect: FioConnectionWalletItem[]
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
    const { fioWallet, fioAddressName, walletsToConnect, walletsToDisconnect, updateConnectedWallets, ccWalletMap, isConnected } = this.props
    if (isConnected) {
      this.setState({ connectWalletsLoading: true })
      const newCcWalletMap = { ...ccWalletMap }
      try {
        const pubAddresses = []
        walletsToConnect.forEach((wallet: FioConnectionWalletItem) => {
          newCcWalletMap[wallet.fullCurrencyCode] = wallet.id
          pubAddresses.push({
            walletId: wallet.id,
            tokenCode: wallet.currencyCode,
            chainCode: wallet.chainCode,
            publicAddress: wallet.publicAddress
          })
        })
        walletsToDisconnect.forEach((wallet: FioConnectionWalletItem) => {
          newCcWalletMap[wallet.fullCurrencyCode] = ''
          pubAddresses.push({
            walletId: wallet.id,
            tokenCode: wallet.currencyCode,
            chainCode: wallet.chainCode,
            publicAddress: '0'
          })
        })
        await updatePubAddressesForFioAddress(fioWallet, fioAddressName, pubAddresses)
        updateConnectedWallets(fioAddressName, newCcWalletMap)
        if (walletsToConnect.length) {
          showToast(s.strings.fio_connect_wallets_success)
        } else {
          if (walletsToDisconnect.length) showToast(s.strings.fio_disconnect_wallets_success)
        }
        Actions.pop()
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
    const { fioAddressName, walletsToConnect, walletsToDisconnect } = this.props
    const { acknowledge, connectWalletsLoading } = this.state

    return (
      <SceneWrapper>
        <ScrollView>
          <View style={styles.info}>
            <T style={styles.title}>{s.strings.fio_address_register_form_field_label}</T>
            <T style={styles.content}>{fioAddressName}</T>
          </View>

          {walletsToConnect.length ? (
            <View style={styles.info}>
              <T style={styles.title}>{s.strings.title_fio_connect_to_wallet}</T>
              {walletsToConnect.map(wallet => (
                <T key={`${wallet.id}-${wallet.currencyCode}`} style={styles.content}>
                  {wallet.name} ({wallet.currencyCode})
                </T>
              ))}
            </View>
          ) : null}

          {walletsToDisconnect.length ? (
            <View style={styles.info}>
              <T style={styles.title}>{s.strings.title_fio_disconnect_wallets}</T>
              {walletsToDisconnect.map(wallet => (
                <T key={`${wallet.id}-${wallet.currencyCode}`} style={styles.content}>
                  {wallet.name} ({wallet.currencyCode})
                </T>
              ))}
            </View>
          ) : null}

          <View style={styles.spacer} />
          <View style={styles.spacer} />

          <View style={styles.confirmContainer}>
            <TouchableWithoutFeedback onPress={this.check}>
              <View style={styles.checkBoxContainer}>
                <View style={styles.checkBox}>{acknowledge && <View style={styles.checkBoxIconOk} />}</View>
                <T style={styles.checkTitle}>{s.strings.fio_connect_checkbox_text}</T>
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.spacer} />
            <View style={styles.spacer} />
            <Slider
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

const rawStyles = {
  info: {
    backgroundColor: THEME.COLORS.SECONDARY,
    paddingVertical: THEME.rem(1),
    paddingHorizontal: THEME.rem(1),
    marginBottom: THEME.rem(0.25)
  },
  title: {
    color: THEME.COLORS.TRANSACTION_DETAILS_GREY_1,
    marginBottom: THEME.rem(0.25),
    fontSize: THEME.rem(0.75),
    fontWeight: 'normal',
    textAlign: 'left'
  },
  content: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(15),
    textAlign: 'left'
  },
  spacer: {
    paddingTop: scale(20)
  },
  checkTitle: {
    fontSize: THEME.rem(0.75),
    color: THEME.COLORS.WHITE,
    marginLeft: scale(15)
  },
  checkBox: {
    borderStyle: 'solid',
    borderWidth: scale(2),
    borderColor: THEME.COLORS.WHITE,
    borderRadius: 15,
    width: THEME.rem(1.5),
    height: THEME.rem(1.5),
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkBoxIconOk: {
    width: THEME.rem(1),
    height: THEME.rem(1),
    borderRadius: 12,
    backgroundColor: THEME.COLORS.ACCENT_MINT
  },
  checkBoxContainer: {
    flexDirection: 'row',
    paddingHorizontal: scale(8),
    justifyContent: 'center',
    alignItems: 'center',
    color: THEME.COLORS.WHITE
  },
  confirmContainer: {
    paddingHorizontal: THEME.rem(2)
  },
  wallet: {
    backgroundColor: THEME.COLORS.TRANSPARENT
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
