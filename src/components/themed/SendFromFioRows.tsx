import { asMaybe, asObject, asOptional, asString, asValue } from 'cleaners'
import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { refreshAllFioAddresses } from '../../actions/FioAddressActions'
import { FIO_STR } from '../../constants/WalletAndCurrencyConstants'
import { lstrings } from '../../locales/strings'
import { connect } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import type { FioAddress, FioRequest } from '../../types/types'
import {
  checkRecordSendFee,
  findWalletByFioAddress,
  FIO_NO_BUNDLED_ERR_CODE
} from '../../util/FioAddressUtils'
import { SectionView } from '../layout/SectionView'
import { AddressModal } from '../modals/AddressModal'
import { ButtonsModal } from '../modals/ButtonsModal'
import { TextInputModal } from '../modals/TextInputModal'
import { EdgeRow } from '../rows/EdgeRow'
import { Airship, showError } from '../services/AirshipInstance'
import { type ThemeProps, withTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'

const asFioBundledError = asObject({
  code: asValue(FIO_NO_BUNDLED_ERR_CODE),
  message: asOptional(asString, '')
})

interface OwnProps {
  navigation: EdgeAppSceneProps<'send2'>['navigation']
  selected: string
  memo: string
  memoError: string
  onSelect: (
    fioAddress: string,
    fioWallet: EdgeCurrencyWallet,
    error: string
  ) => void
  onMemoChange: (memo: string, memoError: string) => void
  fioRequest?: FioRequest
  isSendUsingFioAddress?: boolean
  currencyCode: string
  coreWallet: EdgeCurrencyWallet
}

interface StateProps {
  fioAddresses: FioAddress[]
  fioWallets: EdgeCurrencyWallet[]
}

interface DispatchProps {
  refreshAllFioAddresses: () => void
}

type Props = OwnProps & StateProps & DispatchProps & ThemeProps

interface LocalState {
  loading: boolean
  bundledTxsUpdated: boolean
  prevFioAddresses: FioAddress[]
}

export class SendFromFioRowsComponent extends React.PureComponent<
  Props,
  LocalState
> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      bundledTxsUpdated: false,
      prevFioAddresses: props.fioAddresses
    }
  }

  static getDerivedStateFromProps(
    props: Props,
    state: LocalState
  ): Partial<LocalState> | null {
    const { fioAddresses, selected } = props
    const { prevFioAddresses } = state
    if (fioAddresses.length !== prevFioAddresses.length) {
      return {
        prevFioAddresses: fioAddresses
      }
    }
    const fioAddress = fioAddresses.find(({ name }) => name === selected)
    const prevFioAddress = prevFioAddresses.find(
      ({ name }) => name === selected
    )
    if (
      fioAddress != null &&
      prevFioAddress != null &&
      fioAddress.bundledTxs !== prevFioAddress.bundledTxs
    ) {
      return {
        bundledTxsUpdated: true,
        prevFioAddresses: fioAddresses
      }
    }
    return null
  }

  componentDidMount(): void {
    const { fioRequest, isSendUsingFioAddress, refreshAllFioAddresses } =
      this.props
    if (fioRequest != null || isSendUsingFioAddress === true)
      refreshAllFioAddresses()
    if (fioRequest != null) {
      this.setFioAddress(fioRequest.payer_fio_address).catch((err: unknown) => {
        showError(err)
      })
    } else if (isSendUsingFioAddress === true) {
      this.setDefaultFioAddress().catch((err: unknown) => {
        showError(err)
      })
    }
  }

  componentDidUpdate(prevProps: Props): void {
    const { fioRequest, isSendUsingFioAddress } = this.props
    const { bundledTxsUpdated } = this.state
    if (bundledTxsUpdated) {
      this.setState({ bundledTxsUpdated: false })
      this.setFioAddress(this.props.selected).catch((err: unknown) => {
        showError(err)
      })
    }
    if (
      isSendUsingFioAddress !== prevProps.isSendUsingFioAddress &&
      fioRequest == null &&
      isSendUsingFioAddress === true
    ) {
      this.setDefaultFioAddress().catch((err: unknown) => {
        showError(err)
      })
    }
  }

  async setDefaultFioAddress(): Promise<void> {
    const { fioWallets } = this.props
    this.setState({ loading: true })
    for (const fioWallet of fioWallets) {
      const fioNames: string[] =
        await fioWallet.otherMethods.getFioAddressNames()
      if (fioNames.length > 0) {
        this.setState({ loading: false }, () => {
          this.setFioAddress(fioNames[0], fioWallet).catch((err: unknown) => {
            showError(err)
          })
        })
        break
      }
    }
  }

  selectAddress = async (): Promise<void> => {
    const { currencyCode, coreWallet } = this.props
    const response = await Airship.show<string | undefined>(bridge => (
      <AddressModal
        bridge={bridge}
        title={lstrings.fio_select_address}
        currencyCode={currencyCode}
        walletId={coreWallet.id}
        useUserFioAddressesOnly
      />
    ))
    if (response != null && response !== '') {
      await this.setFioAddress(response)
    }
  }

  handleOpenMessageInput = async (): Promise<void> => {
    const memo = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        autoCorrect
        bridge={bridge}
        initialValue={this.props.memo}
        inputLabel={lstrings.fio_sender_memo_placeholder}
        returnKeyType="done"
        multiline
        submitLabel={lstrings.string_save}
        title={lstrings.fio_sender_memo_label}
      />
    ))
    if (memo != null) this.handleMemoChange(memo)
  }

  setFioAddress = async (
    fioAddress: string,
    fioWallet?: EdgeCurrencyWallet | null
  ): Promise<void> => {
    const { navigation, fioWallets, fioAddresses, fioRequest, currencyCode } =
      this.props
    let resolvedWallet = fioWallet
    if (resolvedWallet == null) {
      if (fioAddresses != null && fioAddress.length > 0) {
        const selectedFioAddress = fioAddresses.find(
          ({ name }) => name === fioAddress
        )
        if (selectedFioAddress != null) {
          resolvedWallet = fioWallets.find(
            ({ id }) => id === selectedFioAddress.walletId
          )
        }
      }
      resolvedWallet ??= await findWalletByFioAddress(fioWallets, fioAddress)
    }
    let error = ''

    if (resolvedWallet == null) {
      error = lstrings.fio_select_address_no_wallet_err
      showError(error)
      return
    }

    try {
      if (fioRequest != null || currencyCode === FIO_STR) {
        await checkRecordSendFee(resolvedWallet, fioAddress)
      }
    } catch (e: unknown) {
      const bundledError = asMaybe(asFioBundledError)(e)
      if (bundledError != null) {
        this.props.onSelect(fioAddress, resolvedWallet, bundledError.message)
        const answer = await Airship.show<'ok' | 'cancel' | undefined>(
          bridge => (
            <ButtonsModal
              bridge={bridge}
              title={lstrings.fio_no_bundled_err_msg}
              message={lstrings.fio_no_bundled_add_err_msg}
              buttons={{
                ok: { label: lstrings.title_fio_add_bundled_txs },
                cancel: { label: lstrings.string_cancel_cap }
              }}
            />
          )
        )
        if (answer === 'ok') {
          navigation.push('fioAddressSettings', {
            showAddBundledTxs: true,
            walletId: resolvedWallet.id,
            fioAddressName: fioAddress
          })
          return
        }
        error = bundledError.message
      } else {
        showError(e)
        error = e instanceof Error ? e.message : String(e)
      }
    }
    this.props.onSelect(fioAddress, resolvedWallet, error)
  }

  handleMemoChange = (memo: string): void => {
    let memoError = ''
    if (memo !== '' && memo.length > 64) {
      memoError = lstrings.send_fio_request_error_memo_inline
    }
    if (memo !== '' && !/^[\x20-\x7E]*$/.test(memo)) {
      memoError = lstrings.send_fio_request_error_memo_invalid_character
    }
    this.props.onMemoChange(memo, memoError)
  }

  renderFioFromAddress(): React.ReactElement {
    const { fioRequest, selected } = this.props
    const { loading } = this.state

    return (
      <EdgeRow
        rightButtonType={fioRequest != null ? 'none' : 'touchable'}
        loading={loading && selected === ''}
        title={lstrings.select_fio_address_address_from}
        body={selected}
        onPress={fioRequest != null ? undefined : this.selectAddress}
      />
    )
  }

  renderFioMemo(): React.ReactElement | null {
    const { memo, memoError, theme } = this.props
    const { loading } = this.state

    if (loading) {
      return null
    }

    if (memoError !== '') {
      return (
        <EdgeRow
          rightButtonType="touchable"
          title={lstrings.select_fio_address_address_memo_error}
          onPress={this.handleOpenMessageInput}
        >
          <EdgeText style={{ color: theme.dangerText }}>{memoError}</EdgeText>
        </EdgeRow>
      )
    }

    return (
      <EdgeRow
        rightButtonType="touchable"
        title={lstrings.select_fio_address_address_memo}
        body={memo !== '' ? memo : lstrings.fio_sender_memo_placeholder}
        onPress={this.handleOpenMessageInput}
      />
    )
  }

  render(): React.ReactElement | null {
    const { fioRequest, isSendUsingFioAddress } = this.props

    if (fioRequest == null && isSendUsingFioAddress !== true) {
      return null
    }

    return (
      <SectionView>
        {this.renderFioFromAddress()}
        {this.renderFioMemo()}
      </SectionView>
    )
  }
}

export const SendFromFioRows = connect<StateProps, DispatchProps, OwnProps>(
  state => {
    return {
      fioAddresses: state.ui.fioAddress.fioAddresses,
      fioWallets: state.ui.fio.fioWallets
    }
  },
  dispatch => ({
    refreshAllFioAddresses() {
      dispatch(refreshAllFioAddresses()).catch((error: unknown) => {
        showError(error)
      })
    }
  })
)(withTheme(SendFromFioRowsComponent))
