import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { refreshAllFioAddresses } from '../../../actions/FioAddressActions'
import { lstrings } from '../../../locales/strings'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { addBundledTxs, getAddBundledTxsFee, getTransferFee } from '../../../util/FioAddressUtils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { FioActionSubmit } from '../../FioAddress/FioActionSubmit'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { EdgeText } from '../../themed/EdgeText'
import { MainButton } from '../../themed/MainButton'
import { SceneHeader } from '../../themed/SceneHeader'
import { CardUi4 } from '../../ui4/CardUi4'
import { RowUi4 } from '../../ui4/RowUi4'
import { SendScene2Params } from '../SendScene2'

interface LocalState {
  showAddBundledTxs: boolean
  showTransfer: boolean
}

interface StateProps {
  isConnected: boolean
}

interface DispatchProps {
  refreshAllFioAddresses: () => Promise<void>
}

interface OwnProps extends EdgeSceneProps<'fioAddressSettings'> {}

type Props = StateProps & DispatchProps & ThemeProps & OwnProps

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
    const { isConnected, route } = this.props
    const { fioAddressName } = route.params

    if (!isConnected) {
      showError(lstrings.fio_network_alert_text)
      return
    }
    return await addBundledTxs(fioWallet, fioAddressName, fee)
  }

  goToTransfer = (params: { fee: number }) => {
    const { isConnected, navigation, route } = this.props
    const { fioWallet, fioAddressName } = route.params

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
        spendTargets: [{ nativeAmount: '', publicAddress: '' }],
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
    const { route, theme } = this.props
    const { fioAddressName, fioWallet, bundledTxs } = route.params
    const { showTransfer, showAddBundledTxs } = this.state
    const styles = getStyles(theme)

    return (
      <SceneWrapper scroll>
        <SceneHeader title={lstrings.title_fio_address_settings} underline withTopMargin />
        <View style={styles.container}>
          <CardUi4 sections>
            <RowUi4 title={lstrings.fio_address_register_form_field_label} body={fioAddressName} />
            {bundledTxs != null ? <RowUi4 title={lstrings.fio_address_details_screen_bundled_txs} body={`${bundledTxs}`} /> : null}
          </CardUi4>
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
            <>
              <MainButton label={lstrings.title_fio_add_bundled_txs} onPress={this.onAddBundledTxsPress} marginRem={[0.25, 0, 0.25]} />
              <MainButton label={lstrings.title_fio_transfer_address} onPress={this.onTransferPress} marginRem={[0.25]} />
            </>
          )}
        </View>
      </SceneWrapper>
    )
  }
}

export const FioAddressSettingsScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    async refreshAllFioAddresses() {
      await dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioAddressSettingsComponent))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    margin: theme.rem(0.5)
  }
}))
