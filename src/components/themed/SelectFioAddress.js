// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions.js'
import { FIO_ADDRESS_SETTINGS } from '../../constants/SceneKeys.js'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { checkRecordSendFee, findWalletByFioAddress, FIO_NO_BUNDLED_ERR_CODE } from '../../modules/FioAddress/util.js'
import { getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { connect } from '../../types/reactRedux.js'
import { Actions } from '../../types/routerTypes.js'
import type { FioAddress, FioRequest, GuiWallet } from '../../types/types'
import { AddressModal } from '../modals/AddressModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { TextInputModal } from '../modals/TextInputModal.js'
import { Airship, showError } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText'
import { Tile } from './Tile.js'

type OwnProps = {
  selected: string,
  memo: string,
  memoError: string,
  onSelect: (fioAddress: string, fioWallet: EdgeCurrencyWallet, error: string) => void,
  onMemoChange: (memo: string, memoError: string) => void,
  fioRequest?: FioRequest,
  isSendUsingFioAddress?: boolean
}

type StateProps = {
  fioAddresses: FioAddress[],
  fioWallets: EdgeCurrencyWallet[],
  selectedWallet: GuiWallet,
  currencyCode: string
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

type LocalState = {
  loading: boolean,
  bundledTxsUpdated: boolean,
  prevFioAddresses: FioAddress[]
}

class SelectFioAddressComponent extends React.PureComponent<Props, LocalState> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      bundledTxsUpdated: false,
      prevFioAddresses: props.fioAddresses
    }
  }

  static getDerivedStateFromProps(props: Props, state: LocalState) {
    const { fioAddresses, selected } = props
    const { prevFioAddresses } = state
    if (fioAddresses.length !== prevFioAddresses.length) {
      return {
        prevFioAddresses: fioAddresses
      }
    }
    const fioAddress = fioAddresses.find(({ name }) => name === selected)
    const prevFioAddress = prevFioAddresses.find(({ name }) => name === selected)
    if (fioAddress && prevFioAddress && fioAddress.bundledTxs !== prevFioAddress.bundledTxs) {
      return {
        bundledTxsUpdated: true,
        prevFioAddresses: fioAddresses
      }
    }
    return null
  }

  componentDidMount() {
    const { fioRequest, isSendUsingFioAddress, refreshAllFioAddresses } = this.props
    if (fioRequest || isSendUsingFioAddress) refreshAllFioAddresses()
    if (fioRequest) {
      this.setFioAddress(fioRequest.payer_fio_address)
    } else if (isSendUsingFioAddress) {
      this.setDefaultFioAddress()
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { fioRequest, isSendUsingFioAddress } = this.props
    const { bundledTxsUpdated } = this.state
    if (bundledTxsUpdated) {
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ bundledTxsUpdated: false })
      this.setFioAddress(this.props.selected)
    }
    if (isSendUsingFioAddress !== prevProps.isSendUsingFioAddress && !fioRequest && isSendUsingFioAddress) {
      this.setDefaultFioAddress()
    }
  }

  async setDefaultFioAddress() {
    const { fioWallets } = this.props
    this.setState({ loading: true })
    for (const fioWallet of fioWallets) {
      const fioNames = await fioWallet.otherMethods.getFioAddressNames()
      if (fioNames.length) {
        this.setState({ loading: false }, () => {
          this.setFioAddress(fioNames[0], fioWallet)
        })
        break
      }
    }
  }

  selectAddress = () => {
    const { currencyCode, selectedWallet } = this.props
    Airship.show(bridge => (
      <AddressModal bridge={bridge} title={s.strings.fio_select_address} currencyCode={currencyCode} walletId={selectedWallet.id} useUserFioAddressesOnly />
    )).then((response: string | null) => {
      if (response) {
        this.setFioAddress(response)
      }
    })
  }

  openMessageInput = () => {
    Airship.show(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.props.memo}
        inputLabel={s.strings.fio_sender_memo_placeholder}
        returnKeyType="done"
        multiline
        submitLabel={s.strings.string_save}
        title={s.strings.fio_sender_memo_label}
      />
    )).then(memo => {
      if (memo != null) this.handleMemoChange(memo)
    })
  }

  setFioAddress = async (fioAddress: string, fioWallet?: EdgeCurrencyWallet | null) => {
    const { fioWallets, fioAddresses, fioRequest, currencyCode } = this.props
    if (!fioWallet) {
      if (fioAddresses && fioAddress.length) {
        const selectedFioAddress = fioAddresses.find(({ name }) => name === fioAddress)
        if (selectedFioAddress) {
          fioWallet = fioWallets.find(({ id }) => id === selectedFioAddress.walletId)
        }
      }
      if (!fioWallet) {
        fioWallet = await findWalletByFioAddress(fioWallets, fioAddress)
      }
    }
    let error = ''

    if (!fioWallet) {
      error = s.strings.fio_select_address_no_wallet_err
      showError(error)
      return
    }

    try {
      if (fioRequest || currencyCode === FIO_STR) {
        await checkRecordSendFee(fioWallet, fioAddress)
      }
    } catch (e) {
      if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE) {
        this.props.onSelect(fioAddress, fioWallet, e.message)
        const answer = await Airship.show(bridge => (
          <ButtonsModal
            bridge={bridge}
            title={s.strings.fio_no_bundled_err_msg}
            message={s.strings.fio_no_bundled_add_err_msg}
            buttons={{
              ok: { label: s.strings.title_fio_add_bundled_txs },
              cancel: { label: s.strings.string_cancel_cap }
            }}
          />
        ))
        if (answer === 'ok') {
          return Actions.push(FIO_ADDRESS_SETTINGS, {
            showAddBundledTxs: true,
            fioWallet,
            fioAddressName: fioAddress
          })
        }
        error = e.message
      } else {
        showError(e)
        error = e.message
      }
    }
    this.props.onSelect(fioAddress, fioWallet, error)
  }

  handleMemoChange = (memo: string) => {
    let memoError = ''
    if (memo && memo.length > 64) {
      memoError = s.strings.send_fio_request_error_memo_inline
    }
    if (memo && !/^[\x20-\x7E]*$/.test(memo)) {
      memoError = s.strings.send_fio_request_error_memo_invalid_character
    }
    this.props.onMemoChange(memo, memoError)
  }

  renderFioFromAddress() {
    const { fioRequest, selected } = this.props
    const { loading } = this.state

    return (
      <Tile
        type={loading && !selected ? 'loading' : fioRequest ? 'static' : 'touchable'}
        title={s.strings.select_fio_address_address_from}
        body={selected}
        onPress={fioRequest ? undefined : this.selectAddress}
      />
    )
  }

  renderFioMemo() {
    const { memo, memoError, theme } = this.props
    const { loading } = this.state

    if (loading) {
      return null
    }

    if (memoError) {
      return (
        <Tile type="touchable" title={s.strings.select_fio_address_address_memo_error} onPress={this.openMessageInput}>
          <EdgeText style={{ color: theme.dangerText }}>{memoError}</EdgeText>
        </Tile>
      )
    }

    return (
      <Tile
        type="touchable"
        title={s.strings.select_fio_address_address_memo}
        body={memo || s.strings.fio_sender_memo_placeholder}
        onPress={this.openMessageInput}
      />
    )
  }

  render() {
    const { fioRequest, isSendUsingFioAddress } = this.props

    if (!fioRequest && !isSendUsingFioAddress) {
      return null
    }

    return (
      <View>
        {this.renderFioFromAddress()}
        {this.renderFioMemo()}
      </View>
    )
  }
}

export const SelectFioAddress = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    const guiWallet: GuiWallet = getSelectedWallet(state)
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode

    return {
      loading: !guiWallet || !currencyCode,
      fioAddresses: state.ui.scenes.fioAddress.fioAddresses,
      fioWallets: state.ui.wallets.fioWallets,
      currencyCode,
      selectedWallet: guiWallet
    }
  },
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses())
    }
  })
)(withTheme(SelectFioAddressComponent))
