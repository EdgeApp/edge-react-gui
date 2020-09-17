// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { FIO_NO_BUNDLED_ERR_CODE, updatePubAddressesForFioAddress } from '../../modules/FioAddress/util'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui.js'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { THEME } from '../../theme/variables/airbitz.js'
import type { FioConnectionWalletItem } from '../../types/types'
import { scale } from '../../util/scaling.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'

export type State = {
  acknowledge: boolean,
  connectWalletsLoading: boolean,
  showSlider: boolean
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

export class FioConnectWalletConfirmScene extends React.Component<Props, State> {
  state = {
    acknowledge: false,
    connectWalletsLoading: false,
    showSlider: true
  }

  confirm = async (): Promise<void> => {
    const { fioWallet, fioAddressName, walletsToConnect, walletsToDisconnect, updateConnectedWallets, ccWalletMap, isConnected } = this.props
    if (isConnected) {
      this.setState({ connectWalletsLoading: true })
      const newCcWalletMap = { ...ccWalletMap }
      try {
        const pubAddresses = []
        walletsToConnect.forEach((wallet: FioConnectionWalletItem) => {
          pubAddresses.push({
            walletId: wallet.id,
            tokenCode: wallet.currencyCode,
            chainCode: wallet.chainCode,
            publicAddress: wallet.publicAddress
          })
        })
        walletsToDisconnect.forEach((wallet: FioConnectionWalletItem) => {
          pubAddresses.push({
            walletId: wallet.id,
            tokenCode: wallet.currencyCode,
            chainCode: wallet.chainCode,
            publicAddress: '0'
          })
        })
        const { updatedCcWallets, error } = await updatePubAddressesForFioAddress(fioWallet, fioAddressName, pubAddresses)
        if (updatedCcWallets.length) {
          for (const { fullCurrencyCode, walletId, isConnection } of updatedCcWallets) {
            newCcWalletMap[fullCurrencyCode] = isConnection ? walletId : ''
          }
          updateConnectedWallets(fioAddressName, newCcWalletMap)
        }

        if (error) {
          if (updatedCcWallets.length) {
            const walletsToConnectLeft = []
            const walletsToDisconnectLeft = []
            for (const walletToConnect of walletsToConnect) {
              if (
                updatedCcWallets.findIndex(
                  ({ walletId, fullCurrencyCode }) => walletId === walletToConnect.id && fullCurrencyCode === walletToConnect.fullCurrencyCode
                ) < 0
              ) {
                walletsToConnectLeft.push(walletToConnect)
              }
            }
            for (const walletToDisconnect of walletsToDisconnect) {
              if (
                updatedCcWallets.findIndex(
                  ({ walletId, fullCurrencyCode }) => walletId === walletToDisconnect.id && fullCurrencyCode === walletToDisconnect.fullCurrencyCode
                ) < 0
              ) {
                walletsToDisconnectLeft.push(walletToDisconnect)
              }
            }
            Actions.refresh({ fioWallet, fioAddressName, walletsToConnect: walletsToConnectLeft, walletsToDisconnect: walletsToDisconnectLeft })
            this.resetSlider()
          }
          throw error
        }
        if (walletsToConnect.length) {
          showToast(s.strings.fio_connect_wallets_success)
        } else {
          if (walletsToDisconnect.length) showToast(s.strings.fio_disconnect_wallets_success)
        }
        Actions.pop()
      } catch (e) {
        if (e.code === FIO_NO_BUNDLED_ERR_CODE) {
          this.setState({ connectWalletsLoading: false })
          const answer = await Airship.show(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={s.strings.fio_no_bundled_err_msg}
              message={s.strings.fio_no_bundled_renew_err_msg}
              buttons={{
                ok: { label: s.strings.title_fio_renew_address },
                cancel: { label: s.strings.string_cancel_cap, type: 'secondary' }
              }}
            />
          ))
          if (answer === 'ok') {
            Actions[Constants.FIO_ADDRESS_SETTINGS]({
              showRenew: true,
              fioWallet,
              fioAddressName: fioAddressName
            })
          }
          return
        }
        showError(e.message)
      }
      this.setState({ connectWalletsLoading: false })
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  resetSlider = (): void => {
    this.setState({ showSlider: false }, () => this.setState({ showSlider: true }))
  }

  check = (): void => {
    const { acknowledge } = this.state

    this.setState({ acknowledge: !acknowledge })
  }

  render() {
    const { fioAddressName, walletsToConnect, walletsToDisconnect } = this.props
    const { acknowledge, connectWalletsLoading, showSlider } = this.state

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
            {showSlider && (
              <Slider
                resetSlider
                onSlidingComplete={this.confirm}
                sliderDisabled={!acknowledge}
                disabledText={s.strings.send_confirmation_slide_to_confirm}
                showSpinner={connectWalletsLoading}
              />
            )}
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
