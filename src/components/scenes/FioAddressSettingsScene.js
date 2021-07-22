// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { Actions } from 'react-native-router-flux'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { FIO_ADDRESS_LIST, SEND } from '../../constants/SceneKeys'
import { formatDate } from '../../locales/intl.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getRenewalFee, getTransferFee, renewFioName } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import type { FioAddress } from '../../types/types'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { PrimaryButton } from '../themed/PrimaryButton.js'
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

type NavigationProps = {
  fioWallet: EdgeCurrencyWallet,
  fioAddressName: string,
  expiration?: string,
  showRenew?: boolean,
  refreshAfterRenew?: boolean
}

type Props = NavigationProps & StateProps & DispatchProps & ThemeProps

class FioAddressSettingsComponent extends React.Component<Props, LocalState> {
  state: LocalState = {
    showRenew: false,
    showTransfer: false
  }

  componentDidMount(): * {
    const { showRenew, refreshAllFioAddresses } = this.props
    refreshAllFioAddresses()
    if (showRenew) {
      this.setState({ showRenew: true })
    }
  }

  afterRenewSuccess = ({ expiration }) => {
    const { fioAddressName, refreshAllFioAddresses, refreshAfterRenew } = this.props
    refreshAllFioAddresses()

    this.setState({ showRenew: false })
    showToast(s.strings.fio_request_renew_ok_text)
    Actions.pop()
    if (refreshAfterRenew) {
      window.requestAnimationFrame(() => {
        Actions.refresh({ fioAddressName, expiration: expiration ? new Date(expiration) : '' })
      })
    }
  }

  afterTransferSuccess = async () => {
    const addressName = `@${this.props.fioAddressName || ''}`
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
    return Actions.popTo(FIO_ADDRESS_LIST)
  }

  getExpiration = (): string => {
    const { fioAddresses, fioAddressName } = this.props
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
    const { fioAddressName, isConnected } = this.props

    if (!isConnected) {
      showError(s.strings.fio_network_alert_text)
      return
    }
    return renewFioName(fioWallet, fioAddressName, renewalFee)
  }

  goToTransfer = (params: { fee: number }) => {
    const { fee: transferFee } = params
    if (!transferFee) return showError(s.strings.fio_get_fee_err_msg)
    this.cancelOperation()

    const guiMakeSpendInfo = {
      nativeAmount: '',
      currencyCode: this.props.fioWallet.currencyInfo.currencyCode,
      otherParams: {
        fioAction: 'transferFioAddress',
        fioParams: { fioAddress: this.props.fioAddressName, newOnwerKey: '', maxFee: transferFee }
      },
      onDone: (err, edgeTransaction) => {
        if (!err) {
          this.afterTransferSuccess()
        }
      }
    }

    Actions[SEND]({
      guiMakeSpendInfo,
      selectedWalletId: this.props.fioWallet.id,
      selectedCurrencyCode: this.props.fioWallet.currencyInfo.currencyCode,
      lockTilesMap: {
        wallet: true
      },
      hiddenTilesMap: {
        amount: true,
        fioAddressSelect: true
      },
      infoTiles: [{ label: s.strings.fio_address_to_transfer, value: this.props.fioAddressName }]
    })
  }

  render() {
    const { fioAddressName, fioWallet } = this.props
    let { expiration } = this.props
    const { showRenew, showTransfer } = this.state

    if (!expiration) {
      expiration = this.getExpiration()
    }

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
            <PrimaryButton label={s.strings.title_fio_renew_address} onPress={this.onRenewPress} marginRem={[1.5, 1, 0.25]} />
            <PrimaryButton label={s.strings.title_fio_transfer_address} onPress={this.onTransferPress} marginRem={[0.25, 1]} />
          </>
        )}
      </SceneWrapper>
    )
  }
}

export const FioAddressSettingsScene = connect<StateProps, DispatchProps, NavigationProps>(
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
