// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'

import { FIO_ADDRESS_SETTINGS } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { FIO_NO_BUNDLED_ERR_CODE, updatePubAddressesForFioAddress } from '../../modules/FioAddress/util'
import { Slider } from '../../modules/UI/components/Slider/Slider.js'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import type { FioConnectionWalletItem } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { Radio } from '../themed/ThemedButtons'
import { Tile } from '../themed/Tile'

type State = {
  acknowledge: boolean,
  connectWalletsLoading: boolean,
  showSlider: boolean
}

type StateProps = {
  ccWalletMap: CcWalletMap,
  isConnected: boolean
}

type RouteProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string,
  walletsToConnect: FioConnectionWalletItem[],
  walletsToDisconnect: FioConnectionWalletItem[]
}

type DispatchProps = {
  updateConnectedWallets: (fioAddress: string, ccWalletMap: CcWalletMap) => void
}

type Props = StateProps & DispatchProps & RouteProps & ThemeProps

export class FioConnectWalletConfirm extends React.Component<Props, State> {
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
        const { updatedCcWallets, error } = await updatePubAddressesForFioAddress(
          fioWallet,
          fioAddressName,
          walletsToConnect.map((wallet: FioConnectionWalletItem) => ({
            walletId: wallet.id,
            tokenCode: wallet.currencyCode,
            chainCode: wallet.chainCode,
            publicAddress: wallet.publicAddress
          }))
        )
        if (updatedCcWallets.length) {
          for (const { fullCurrencyCode, walletId } of updatedCcWallets) {
            newCcWalletMap[fullCurrencyCode] = walletId
          }
          updateConnectedWallets(fioAddressName, newCcWalletMap)
        }

        const { updatedCcWallets: removedCcWallets, error: removedError } = await updatePubAddressesForFioAddress(
          fioWallet,
          fioAddressName,
          walletsToDisconnect.map((wallet: FioConnectionWalletItem) => ({
            walletId: wallet.id,
            tokenCode: wallet.currencyCode,
            chainCode: wallet.chainCode,
            publicAddress: wallet.publicAddress
          })),
          false
        )
        if (removedCcWallets.length) {
          for (const { fullCurrencyCode } of removedCcWallets) {
            newCcWalletMap[fullCurrencyCode] = ''
          }
          updateConnectedWallets(fioAddressName, newCcWalletMap)
        }

        if (error || removedError) {
          const walletsToConnectLeft = []
          const walletsToDisconnectLeft = []
          if (updatedCcWallets.length) {
            for (const walletToConnect of walletsToConnect) {
              if (
                updatedCcWallets.findIndex(
                  ({ walletId, fullCurrencyCode }) => walletId === walletToConnect.id && fullCurrencyCode === walletToConnect.fullCurrencyCode
                ) < 0
              ) {
                walletsToConnectLeft.push(walletToConnect)
              }
            }
          }
          if (removedCcWallets.length) {
            for (const walletToDisconnect of walletsToDisconnect) {
              if (
                removedCcWallets.findIndex(
                  ({ walletId, fullCurrencyCode }) => walletId === walletToDisconnect.id && fullCurrencyCode === walletToDisconnect.fullCurrencyCode
                ) < 0
              ) {
                walletsToDisconnectLeft.push(walletToDisconnect)
              }
            }
          }
          if (walletsToConnectLeft.length || walletsToDisconnectLeft.length) {
            Actions.refresh({ fioWallet, fioAddressName, walletsToConnect: walletsToConnectLeft, walletsToDisconnect: walletsToDisconnectLeft })
            this.resetSlider()
          }
          throw error || removedError
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
            Actions.push(FIO_ADDRESS_SETTINGS, {
              showRenew: true,
              fioWallet,
              fioAddressName: fioAddressName
            })
          }
          return
        }
        this.resetSlider()
        showError(e)
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

  renderWalletLine = (wallet: FioConnectionWalletItem) => {
    const styles = getStyles(this.props.theme)
    const label = `${wallet.name} (${wallet.currencyCode})`
    return (
      <EdgeText key={`${wallet.id}-${wallet.currencyCode}`} style={styles.content}>
        {label}
      </EdgeText>
    )
  }

  render() {
    const { fioAddressName, walletsToConnect, walletsToDisconnect, theme } = this.props
    const { acknowledge, connectWalletsLoading, showSlider } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper background="header">
        <ScrollView>
          <Tile type="static" title={s.strings.fio_address_register_form_field_label} body={fioAddressName} />
          {walletsToConnect.length ? (
            <Tile type="static" title={s.strings.title_fio_connect_to_wallet}>
              {walletsToConnect.map(this.renderWalletLine)}
            </Tile>
          ) : null}

          {walletsToDisconnect.length ? (
            <Tile type="static" title={s.strings.title_fio_disconnect_wallets}>
              {walletsToDisconnect.map(this.renderWalletLine)}
            </Tile>
          ) : null}

          <Radio value={acknowledge} onPress={this.check} marginRem={[2, 2, 0]}>
            <EdgeText style={styles.checkTitle} numberOfLines={4}>
              {s.strings.fio_connect_checkbox_text}
            </EdgeText>
          </Radio>
          {showSlider && (
            <Slider
              parentStyle={styles.slider}
              onSlidingComplete={this.confirm}
              disabled={!acknowledge || connectWalletsLoading}
              disabledText={s.strings.send_confirmation_slide_to_confirm}
              showSpinner={connectWalletsLoading}
            />
          )}
        </ScrollView>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    color: theme.primaryText,
    fontSize: theme.rem(1),
    marginHorizontal: theme.rem(0.25),
    textAlign: 'left'
  },
  checkTitle: {
    fontSize: theme.rem(0.75),
    color: theme.primaryText,
    marginLeft: theme.rem(1)
  },
  slider: {
    paddingVertical: theme.rem(2)
  }
}))

export const FioConnectWalletConfirmScene = connect<StateProps, DispatchProps, RouteProps>(
  (state, ownProps) => ({
    ccWalletMap: state.ui.fio.connectedWalletsByFioAddress[ownProps.fioAddressName],
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    updateConnectedWallets(fioAddress: string, ccWalletMap: CcWalletMap) {
      dispatch({
        type: 'FIO/UPDATE_CONNECTED_WALLETS_FOR_FIO_ADDRESS',
        data: { fioAddress, ccWalletMap }
      })
    }
  })
)(withTheme(FioConnectWalletConfirm))
