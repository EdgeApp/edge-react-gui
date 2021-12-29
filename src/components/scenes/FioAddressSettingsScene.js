// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { addBundles, getAddBundlesFee, getTransferFee } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { Tile } from '../themed/Tile'

type LocalState = {
  showAddBundles: boolean,
  showTransfer: boolean
}

type StateProps = {
  isConnected: boolean
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type OwnProps = {
  navigation: NavigationProp<'fioAddressSettings'>,
  route: RouteProp<'fioAddressSettings'>
}

type Props = StateProps & DispatchProps & ThemeProps & OwnProps

class FioAddressSettingsComponent extends React.Component<Props, LocalState> {
  state: LocalState = {
    showAddBundles: false,
    showTransfer: false
  }

  componentDidMount(): * {
    const { refreshAllFioAddresses, route } = this.props
    const { showAddBundles } = route.params
    refreshAllFioAddresses()
    if (showAddBundles) {
      this.setState({ showAddBundles: true })
    }
  }

  afterAddBundlesSuccess = (result: { bundles: number } | any) => {
    const { refreshAllFioAddresses, navigation, route } = this.props
    const { fioWallet, fioAddressName, refreshAfterAddBundles } = route.params

    refreshAllFioAddresses()

    this.setState({ showAddBundles: false })
    showToast(s.strings.fio_request_add_bundles_ok_text)
    navigation.goBack()
    if (result.bundles != null && refreshAfterAddBundles) {
      window.requestAnimationFrame(() => {
        navigation.setParams({
          fioWallet,
          fioAddressName,
          bundles: result.bundles
        })
      })
    }
  }

  afterTransferSuccess = async () => {
    const { navigation, route } = this.props
    const { fioAddressName = '' } = route.params

    const addressName = `@${fioAddressName}`
    // todo: styles for message
    const transferredMessage = `${addressName} ${s.strings.fio_domain_transferred.toLowerCase()}`
    await Airship.show(bridge => (
      <ButtonsModal bridge={bridge} title={s.strings.fio_domain_transferred} buttons={{ ok: { label: s.strings.string_ok_cap } }}>
        <EdgeText>{transferredMessage}</EdgeText>
      </ButtonsModal>
    ))
    return navigation.navigate('fioAddressList')
  }

  onTransferPress = () => {
    this.setState({ showTransfer: true })
  }

  onAddBundlesPress = () => {
    this.setState({ showAddBundles: true })
  }

  cancelOperation = () => {
    this.setState({ showTransfer: false, showAddBundles: false })
  }

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => getTransferFee(fioWallet)

  onAddBundlesSubmit = async (fioWallet: EdgeCurrencyWallet, fee: number) => {
    const { isConnected, route } = this.props
    const { fioAddressName } = route.params

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    return addBundles(fioWallet, fioAddressName, fee)
  }

  goToTransfer = (params: { fee: number }) => {
    const { isConnected, navigation, route } = this.props
    const { fioWallet, fioAddressName } = route.params

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }

    const { fee: transferFee } = params
    if (!transferFee) return showError(s.strings.fio_get_fee_err_msg)
    this.cancelOperation()

    const guiMakeSpendInfo = {
      nativeAmount: '',
      currencyCode: fioWallet.currencyInfo.currencyCode,
      otherParams: {
        fioAction: 'transferFioAddress',
        fioParams: { fioAddress: fioAddressName, newOnwerKey: '', maxFee: transferFee }
      },
      onDone: (err, edgeTransaction) => {
        if (!err) {
          this.afterTransferSuccess()
        }
      }
    }

    navigation.navigate('send', {
      guiMakeSpendInfo,
      selectedWalletId: fioWallet.id,
      selectedCurrencyCode: fioWallet.currencyInfo.currencyCode,
      lockTilesMap: {
        wallet: true
      },
      hiddenTilesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: s.strings.fio_address_to_transfer, value: fioAddressName }]
    })
  }

  render() {
    const { route } = this.props
    const { fioAddressName, fioWallet, bundles } = route.params
    const { showTransfer, showAddBundles } = this.state

    return (
      <SceneWrapper background="header">
        <Tile type="static" title={s.strings.fio_address_register_form_field_label} body={fioAddressName} />
        {bundles != null ? <Tile type="static" title={s.strings.fio_address_details_screen_bundles} body={`${bundles}`} /> : null}
        {showAddBundles && (
          <FioActionSubmit
            title={s.strings.title_fio_add_bundles}
            onSubmit={this.onAddBundlesSubmit}
            onSuccess={this.afterAddBundlesSuccess}
            getOperationFee={getAddBundlesFee}
            successMessage={s.strings.fio_request_add_bundles_ok_text}
            cancelOperation={this.cancelOperation}
            fioWallet={fioWallet}
            addressTitles
            showPaymentWalletPicker
          />
        )}
        {showTransfer && <FioActionSubmit goTo={this.goToTransfer} getOperationFee={this.getTransferFee} fioWallet={fioWallet} addressTitles />}
        {!showAddBundles && !showTransfer && (
          <>
            <MainButton label={s.strings.title_fio_add_bundles} onPress={this.onAddBundlesPress} marginRem={[1.5, 1, 0.25]} />
            <MainButton label={s.strings.title_fio_transfer_address} onPress={this.onTransferPress} marginRem={[0.25, 1]} />
          </>
        )}
      </SceneWrapper>
    )
  }
}

export const FioAddressSettingsScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioAddressSettingsComponent))
