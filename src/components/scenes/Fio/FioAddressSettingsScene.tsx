import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { CryptoAmount } from '../../../util/CryptoAmount'
import { addBundledTxs, getAddBundledTxsFee, getTransferFee } from '../../../util/FioAddressUtils'
import { logEvent, TrackingEventName, TrackingValues } from '../../../util/tracking'
import { ButtonsView } from '../../buttons/ButtonsView'
import { EdgeCard } from '../../cards/EdgeCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { FioActionSubmit } from '../../FioAddress/FioActionSubmit'
import { withWallet } from '../../hoc/withWallet'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { EdgeRow } from '../../rows/EdgeRow'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { SendScene2Params } from '../SendScene2'

export interface FioAddressSettingsParams {
  fioAddressName: string
  walletId: string
  bundledTxs?: number
  showAddBundledTxs?: boolean
  refreshAfterAddBundledTxs?: boolean
}

interface LocalState {
  showAddBundledTxs: boolean
  showTransfer: boolean
}

interface StateProps {
  isConnected: boolean
}

interface DispatchProps {
  refreshAllFioAddresses: () => Promise<void>
  onLogEvent: (event: TrackingEventName, values: TrackingValues) => void
}

interface OwnProps extends EdgeSceneProps<'fioAddressSettings'> {
  wallet: EdgeCurrencyWallet
}

type Props = StateProps & DispatchProps & ThemeProps & OwnProps

/**
 * FIO "Reload and Transfer" scene.
 */
export class FioAddressSettingsComponent extends React.Component<Props, LocalState> {
  state: LocalState = {
    showAddBundledTxs: false,
    showTransfer: false
  }

  componentDidMount() {
    const { refreshAllFioAddresses, route } = this.props
    const { showAddBundledTxs } = route.params
    refreshAllFioAddresses().catch(err => showError(err))
    if (showAddBundledTxs) {
      this.setState({ showAddBundledTxs: true })
    }
  }

  afterAddBundledTxsSuccess = () => {
    const { refreshAllFioAddresses, navigation } = this.props

    refreshAllFioAddresses().catch(err => showError(err))

    this.setState({ showAddBundledTxs: false })
    showToast(lstrings.fio_request_add_bundled_txs_ok_text)
    navigation.goBack() // todo: fix goBack, now it is not going back to address details scene
  }

  afterTransferSuccess = async () => {
    const { navigation, route } = this.props
    const { fioAddressName = '' } = route.params

    // todo: styles for message
    const transferredMessage = `${fioAddressName} ${lstrings.fio_domain_transferred.toLowerCase()}`
    await Airship.show<'ok' | undefined>(bridge => (
      <ButtonsModal bridge={bridge} title={lstrings.fio_domain_transferred} buttons={{ ok: { label: lstrings.string_ok_cap } }}>
        <EdgeText>{transferredMessage}</EdgeText>
      </ButtonsModal>
    ))
    return navigation.navigate('fioAddressList', {})
  }

  onTransferPress = () => {
    this.setState({ showTransfer: true })
  }

  onAddBundledTxsPress = () => {
    this.setState({ showAddBundledTxs: true })
  }

  cancelOperation = () => {
    this.setState({ showTransfer: false, showAddBundledTxs: false })
  }

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => await getTransferFee(fioWallet)

  onAddBundledTxsSubmit = async (fioWallet: EdgeCurrencyWallet, fee: number) => {
    const { isConnected, route, onLogEvent } = this.props
    const { fioAddressName } = route.params

    if (!isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    await addBundledTxs(fioWallet, fioAddressName, fee)

    onLogEvent('Fio_Handle_Bundled_Tx', {
      conversionValues: {
        conversionType: 'crypto',
        cryptoAmount: new CryptoAmount({ nativeAmount: String(fee), currencyConfig: fioWallet.currencyConfig, tokenId: null })
      }
    })
  }

  goToTransfer = (params: { fee: number }) => {
    const { isConnected, navigation, route, wallet: fioWallet } = this.props
    const { fioAddressName } = route.params

    if (!isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }

    const { fee: transferFee } = params
    if (!transferFee) return showError(lstrings.fio_get_fee_err_msg)
    this.cancelOperation()

    const sendParams: SendScene2Params = {
      tokenId: null,
      spendInfo: {
        tokenId: null,
        spendTargets: [{ nativeAmount: '' }],
        otherParams: {
          action: {
            name: 'transferFioAddress',
            params: { fioAddress: fioAddressName, maxFee: transferFee }
          }
        }
      },
      onDone: err => {
        if (!err) {
          this.afterTransferSuccess().catch(err => showError(err))
        }
      },
      walletId: fioWallet.id,
      lockTilesMap: {
        wallet: true
      },
      hiddenFeaturesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: lstrings.fio_address_to_transfer, value: fioAddressName }]
    }

    navigation.navigate('send2', sendParams)
  }

  render() {
    const { route, theme, wallet: fioWallet } = this.props
    const { fioAddressName, bundledTxs } = route.params
    const { showTransfer, showAddBundledTxs } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper scroll>
        <SceneHeader title={lstrings.title_fio_address_settings} underline withTopMargin />
        <View style={styles.container}>
          <EdgeCard sections>
            <EdgeRow title={lstrings.fio_address_register_form_field_label} body={fioAddressName} />
            {bundledTxs != null ? <EdgeRow title={lstrings.fio_address_details_screen_bundled_txs} body={`${bundledTxs}`} /> : null}
          </EdgeCard>
          {showAddBundledTxs && (
            <FioActionSubmit
              onSubmit={this.onAddBundledTxsSubmit}
              onSuccess={this.afterAddBundledTxsSuccess}
              getOperationFee={getAddBundledTxsFee}
              successMessage={lstrings.fio_request_add_bundled_txs_ok_text}
              onCancel={this.cancelOperation}
              fioWallet={fioWallet}
              addressTitles
              showPaymentWalletPicker
              navigation={this.props.navigation}
            />
          )}
          {showTransfer && (
            <FioActionSubmit
              goTo={this.goToTransfer}
              getOperationFee={this.getTransferFee}
              fioWallet={fioWallet}
              addressTitles
              navigation={this.props.navigation}
            />
          )}
          {!showAddBundledTxs && !showTransfer && (
            <ButtonsView
              secondary={{
                label: lstrings.title_fio_add_bundled_txs,
                onPress: this.onAddBundledTxsPress
              }}
              secondary2={{
                label: lstrings.title_fio_transfer_address,
                onPress: this.onTransferPress
              }}
            />
          )}
        </View>
      </SceneWrapper>
    )
  }
}

const FioAddressSettingsConnected = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    },
    onLogEvent(event: TrackingEventName, values: TrackingValues) {
      dispatch(logEvent(event, values))
    }
  })
)(withTheme(FioAddressSettingsComponent))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    margin: theme.rem(0.5)
  }
}))

export const FioAddressSettingsScene = withWallet(FioAddressSettingsConnected)
