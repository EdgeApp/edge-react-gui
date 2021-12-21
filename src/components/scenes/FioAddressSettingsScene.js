// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import s from '../../locales/strings'
import { FioActionSubmit } from '../../modules/FioAddress/components/FioActionSubmit'
import { getTransferFee } from '../../modules/FioAddress/util'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship, showError } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton.js'
import { Tile } from '../themed/Tile'

type LocalState = {
  showTransfer: boolean
  // todo: showAddBundles
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
    showTransfer: false
  }

  componentDidMount(): * {
    this.props.refreshAllFioAddresses()
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

  cancelOperation = () => {
    this.setState({ showTransfer: false })
  }

  getTransferFee = async (fioWallet: EdgeCurrencyWallet) => getTransferFee(fioWallet)

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
    const { fioAddressName, fioWallet } = route.params
    const { showTransfer } = this.state

    return (
      <SceneWrapper background="header">
        <Tile type="static" title={s.strings.fio_address_register_form_field_label} body={fioAddressName} />
        {showTransfer && <FioActionSubmit goTo={this.goToTransfer} getOperationFee={this.getTransferFee} fioWallet={fioWallet} addressTitles />}
        {!showTransfer && <MainButton label={s.strings.title_fio_transfer_address} onPress={this.onTransferPress} marginRem={[0.25, 1]} />}
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
