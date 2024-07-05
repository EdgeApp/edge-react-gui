import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { lstrings } from '../../../locales/strings'
import { CcWalletMap } from '../../../reducers/FioReducer'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { FioConnectionWalletItem } from '../../../types/types'
import { FIO_NO_BUNDLED_ERR_CODE, updatePubAddressesForFioAddress } from '../../../util/FioAddressUtils'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withWallet } from '../../hoc/withWallet'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { Slider } from '../../themed/Slider'
import { Radio } from '../../themed/ThemedButtons'

export interface FioConnectWalletConfirmParams {
  fioAddressName: string
  walletId: string
  walletsToConnect: FioConnectionWalletItem[]
  walletsToDisconnect: FioConnectionWalletItem[]
}

interface State {
  acknowledge: boolean
  connectWalletsLoading: boolean
  showSlider: boolean
}

interface StateProps {
  ccWalletMap: CcWalletMap
  isConnected: boolean
}

interface OwnProps extends EdgeSceneProps<'fioConnectToWalletsConfirm'> {
  wallet: EdgeCurrencyWallet
}

interface DispatchProps {
  updateConnectedWallets: (fioAddress: string, ccWalletMap: CcWalletMap) => void
}

type Props = StateProps & DispatchProps & OwnProps & ThemeProps

export class FioConnectWalletConfirm extends React.Component<Props, State> {
  state = {
    acknowledge: false,
    connectWalletsLoading: false,
    showSlider: true
  }

  confirm = async (): Promise<void> => {
    const { updateConnectedWallets, ccWalletMap, isConnected, navigation, route, wallet: fioWallet } = this.props
    const { fioAddressName, walletsToConnect, walletsToDisconnect } = route.params
    if (isConnected) {
      this.setState({ connectWalletsLoading: true })
      const newCcWalletMap = { ...ccWalletMap }
      try {
        let promiseArray = walletsToConnect.map(async (wallet: FioConnectionWalletItem) => ({
          walletId: wallet.id,
          tokenCode: wallet.currencyCode,
          chainCode: wallet.chainCode,
          publicAddress: (await wallet.edgeWallet.getReceiveAddress({ tokenId: null })).publicAddress
        }))

        let publicAddresses = await Promise.all(promiseArray)

        const { updatedCcWallets, error } = await updatePubAddressesForFioAddress(fioWallet, fioAddressName, publicAddresses)
        if (updatedCcWallets.length) {
          for (const { fullCurrencyCode, walletId } of updatedCcWallets) {
            newCcWalletMap[fullCurrencyCode] = walletId
          }
          updateConnectedWallets(fioAddressName, newCcWalletMap)
        }

        promiseArray = walletsToDisconnect.map(async (wallet: FioConnectionWalletItem) => ({
          walletId: wallet.id,
          tokenCode: wallet.currencyCode,
          chainCode: wallet.chainCode,
          publicAddress: (await wallet.edgeWallet.getReceiveAddress({ tokenId: null })).publicAddress
        }))

        publicAddresses = await Promise.all(promiseArray)

        const { updatedCcWallets: removedCcWallets, error: removedError } = await updatePubAddressesForFioAddress(
          fioWallet,
          fioAddressName,
          publicAddresses,
          false
        )
        if (removedCcWallets.length) {
          for (const { fullCurrencyCode } of removedCcWallets) {
            newCcWalletMap[fullCurrencyCode] = ''
          }
          updateConnectedWallets(fioAddressName, newCcWalletMap)
        }

        const eitherError = error ?? removedError
        if (eitherError != null) {
          const walletsToConnectLeft: FioConnectionWalletItem[] = []
          const walletsToDisconnectLeft: FioConnectionWalletItem[] = []
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
            navigation.setParams({
              walletId: fioWallet.id,
              fioAddressName,
              walletsToConnect: walletsToConnectLeft,
              walletsToDisconnect: walletsToDisconnectLeft
            })
            this.resetSlider()
          }
          throw eitherError
        }
        if (walletsToConnect.length) {
          showToast(lstrings.fio_connect_wallets_success)
        } else {
          if (walletsToDisconnect.length) showToast(lstrings.fio_disconnect_wallets_success)
        }
        navigation.goBack()
      } catch (e: any) {
        if (e.code === FIO_NO_BUNDLED_ERR_CODE) {
          this.setState({ connectWalletsLoading: false })
          const answer = await Airship.show<'ok' | undefined>(bridge => (
            <ButtonsModal
              bridge={bridge}
              title={lstrings.fio_no_bundled_err_msg}
              message={lstrings.fio_no_bundled_add_err_msg}
              buttons={{
                ok: { label: lstrings.title_fio_add_bundled_txs }
              }}
              closeArrow
            />
          ))
          if (answer === 'ok') {
            navigation.navigate('fioAddressSettings', {
              showAddBundledTxs: true,
              walletId: fioWallet.id,
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
      showError(lstrings.fio_network_alert_text)
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
    const { theme, route } = this.props
    const { fioAddressName, walletsToConnect, walletsToDisconnect } = route.params
    const { acknowledge, connectWalletsLoading, showSlider } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper scroll>
        <SceneHeader title={lstrings.title_fio_connect_to_wallet} underline withTopMargin />
        <View style={styles.container}>
          <EdgeCard sections>
            <EdgeRow title={lstrings.fio_address_register_form_field_label} body={fioAddressName} />
            {walletsToConnect.length ? <EdgeRow title={lstrings.title_fio_connect_to_wallet}>{walletsToConnect.map(this.renderWalletLine)}</EdgeRow> : null}

            {walletsToDisconnect.length ? (
              <EdgeRow title={lstrings.title_fio_disconnect_wallets}>{walletsToDisconnect.map(this.renderWalletLine)}</EdgeRow>
            ) : null}
          </EdgeCard>

          <Radio value={acknowledge} onPress={this.check} marginRem={[2, 2, 0]}>
            <EdgeText style={styles.checkTitle} numberOfLines={4}>
              {lstrings.fio_connect_checkbox_text}
            </EdgeText>
          </Radio>
          {showSlider && (
            <Slider
              parentStyle={styles.slider}
              onSlidingComplete={this.confirm}
              disabled={!acknowledge || connectWalletsLoading}
              disabledText={lstrings.send_confirmation_slide_to_confirm}
              showSpinner={connectWalletsLoading}
            />
          )}
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    padding: theme.rem(0.5)
  },
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

const FioConnectWalletConfirmConnected = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    ccWalletMap: state.ui.fio.connectedWalletsByFioAddress[params.fioAddressName],
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

export const FioConnectWalletConfirmScene = withWallet(FioConnectWalletConfirmConnected)
