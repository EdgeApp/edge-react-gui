// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getRenewalFee, getTransferFee, renewFioName } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import type { FioAddress } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { Tile } from '../themed/Tile'

type LocalState = {
  showRenew: boolean,
  showTransfer: boolean
}

type StateProps = {
  fioAddresses: FioAddress[],
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
    showRenew: false,
    showTransfer: false
  }

  componentDidMount(): * {
    const { refreshAllFioAddresses, route } = this.props
    const { showRenew } = route.params
    refreshAllFioAddresses()
    if (showRenew) {
      this.setState({ showRenew: true })
    }
  }

  afterRenewSuccess = ({ expiration = '' }) => {
    const { refreshAllFioAddresses, navigation, route } = this.props
    const { fioWallet, fioAddressName, refreshAfterRenew } = route.params

    refreshAllFioAddresses()

    this.setState({ showRenew: false })
    showToast(s.strings.fio_request_renew_ok_text)
    navigation.goBack()
    if (refreshAfterRenew) {
      window.requestAnimationFrame(() => {
        navigation.setParams({
          fioWallet,
          fioAddressName,
          expiration
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
      <ButtonsModal
        bridge={bridge}
        title={s.strings.fio_domain_transferred}
        buttons={{
          ok: { label: s.strings.string_ok_cap }
        }}
      >
        <EdgeText>{transferredMessage}</EdgeText>
      </ButtonsModal>
    ))
    return navigation.navigate('fioAddressList')
  }

  getExpiration = (): string => {
    const { fioAddresses, route } = this.props
    const { fioAddressName } = route.params
    const fioAddress = fioAddresses.find(({ name }) => fioAddressName === name)
    if (fioAddress) return fioAddress.expiration
    return ''
  }

  onRenewPress = () => {
    this.setState({ showRenew: true })
  }

  onTransferPress = () => {
    this.setState({ showTransfer: true })
  }

  cancelOperation = () => {
    this.setState({ showRenew: false, showTransfer: false })
  }

  getRenewalFee = async (fioWallet: EdgeCurrencyWallet) => getRenewalFee(fioWallet)

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => getTransferFee(fioWallet)

  renewAddress = async (fioWallet: EdgeCurrencyWallet, renewalFee: number) => {
    const { isConnected, route } = this.props
    const { fioAddressName } = route.params

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    return renewFioName(fioWallet, fioAddressName, renewalFee)
  }

  goToTransfer = (params: { fee: number }) => {
    const { navigation, route } = this.props
    const { fioWallet, fioAddressName } = route.params

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
    const { fioAddressName, fioWallet, expiration = this.getExpiration() } = route.params
    const { showRenew, showTransfer } = this.state

    return (
      <SceneWrapper background="header">
        <Tile type="static" title={s.strings.fio_address_register_form_field_label} body={fioAddressName} />
        <Tile type="static" title={s.strings.fio_address_details_screen_expires} body={formatDate(new Date(expiration))} />
        {showRenew && (
          <FioActionSubmit
            title={s.strings.title_fio_renew_address}
            onSubmit={this.renewAddress}
            onSuccess={this.afterRenewSuccess}
            getOperationFee={this.getRenewalFee}
            successMessage={s.strings.fio_request_renew_ok_text}
            cancelOperation={this.cancelOperation}
            fioWallet={fioWallet}
            addressTitles
            showPaymentWalletPicker
          />
        )}
        {showTransfer && <FioActionSubmit goTo={this.goToTransfer} getOperationFee={this.getTransferFee} fioWallet={fioWallet} addressTitles />}
        {!showRenew && !showTransfer && (
          <>
            <MainButton label={s.strings.title_fio_renew_address} onPress={this.onRenewPress} marginRem={[1.5, 1, 0.25]} />
            <MainButton label={s.strings.title_fio_transfer_address} onPress={this.onTransferPress} marginRem={[0.25, 1]} />
          </>
        )}
      </SceneWrapper>
    )
  }
}

export const FioAddressSettingsScene = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    fioAddresses: state.ui.scenes.fioAddress.fioAddresses,
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(FioAddressSettingsComponent))
