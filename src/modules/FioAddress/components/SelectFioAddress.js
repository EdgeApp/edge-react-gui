// @flow

import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { ArrowDownTextIconButton } from '../../../components/common/ArrowDownTextIconButton.js'
import { AddressModal } from '../../../components/modals/AddressModal'
import { ButtonsModal } from '../../../components/modals/ButtonsModal'
import { TransactionDetailsNotesInput } from '../../../components/modals/TransactionDetailsNotesInput'
import { Airship, showError } from '../../../components/services/AirshipInstance'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import { THEME } from '../../../theme/variables/airbitz.js'
import { type Dispatch, type RootState } from '../../../types/reduxTypes'
import type { FioAddress, FioRequest, GuiWallet } from '../../../types/types'
import { scale } from '../../../util/scaling.js'
import Text from '../../UI/components/FormattedText/FormattedText.ui.js'
import * as UI_SELECTORS from '../../UI/selectors.js'
import { refreshAllFioAddresses } from '../action'
import { checkRecordSendFee, findWalletByFioAddress, FIO_NO_BUNDLED_ERR_CODE } from '../util'

type SelectFioAddressOwnProps = {
  selected: string,
  memo: string,
  memoError: string,
  onSelect: (fioAddress: string, fioWallet: EdgeCurrencyWallet, error: string) => void,
  onMemoChange: (memo: string, memoError: string) => void,
  fioRequest: FioRequest | null,
  isSendUsingFioAddress: boolean | null
}

type SelectFioAddressProps = {
  loading: boolean,
  fioAddresses: FioAddress[],
  fioWallets: EdgeCurrencyWallet[],
  selectedWallet: GuiWallet,
  currencyCode: string
}

type DispatchProps = {
  refreshAllFioAddresses: () => void
}

type Props = SelectFioAddressOwnProps & SelectFioAddressProps & DispatchProps

type LocalState = {
  loading: boolean,
  expirationUpdated: boolean,
  prevFioAddresses: FioAddress[]
}

class SelectFioAddress extends React.Component<Props, LocalState> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      expirationUpdated: false,
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
    if (fioAddress && prevFioAddress && fioAddress.expiration !== prevFioAddress.expiration) {
      return {
        expirationUpdated: true,
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

  componentDidUpdate() {
    const { expirationUpdated } = this.state
    if (expirationUpdated) {
      this.setState({ expirationUpdated: false })
      this.setFioAddress(this.props.selected)
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
      <TransactionDetailsNotesInput
        bridge={bridge}
        title={s.strings.fio_sender_memo_label}
        placeholder={s.strings.fio_sender_memo_placeholder}
        notes={this.props.memo}
        onChange={this.onMemoChange}
      />
    )).then(_ => {})
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
      if (fioRequest || currencyCode === Constants.FIO_STR) {
        await checkRecordSendFee(fioWallet, fioAddress)
      }
    } catch (e) {
      if (e.code && e.code === FIO_NO_BUNDLED_ERR_CODE) {
        this.props.onSelect(fioAddress, fioWallet, e.message)
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
          return Actions[Constants.FIO_ADDRESS_SETTINGS]({
            showRenew: true,
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

  onMemoChange = (memo: string) => {
    let memoError = ''
    if (memo && memo.length > 64) {
      memoError = s.strings.send_fio_request_error_memo_inline
    }
    if (memo && !/^[\x20-\x7E]*$/.test(memo)) {
      memoError = s.strings.send_fio_request_error_memo_invalid_character
    }
    this.props.onMemoChange(memo, memoError)
  }

  renderFioAddress() {
    const { selected, fioRequest } = this.props
    const { loading } = this.state

    if (loading) return <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={styles.loading} size="small" />

    if (fioRequest) {
      return (
        <View>
          <Text style={styles.selectAddressText}>
            {s.strings.fragment_send_from_label}: {selected}
          </Text>
        </View>
      )
    }

    return (
      <View style={styles.textIconContainer}>
        <ArrowDownTextIconButton
          onPress={this.selectAddress}
          title={<Text style={styles.selectAddressText} ellipsizeMode="middle" numberOfLines={1}>{`${s.strings.fragment_send_from_label}: ${selected}`}</Text>}
        />
      </View>
    )
  }

  render() {
    const { fioRequest, selected, memo, memoError, loading: walletLoading, isSendUsingFioAddress } = this.props
    const { loading } = this.state
    if (!fioRequest && !isSendUsingFioAddress) return null
    if (!fioRequest && !selected) return null
    if (walletLoading) {
      return (
        <View style={[styles.selectContainer, styles.selectFullWidth]}>
          <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} style={styles.loading} size="small" />
        </View>
      )
    }

    return (
      <View style={[styles.selectContainer, styles.selectFullWidth]}>
        {this.renderFioAddress()}
        {!loading && (
          <TouchableWithoutFeedback onPress={this.openMessageInput}>
            <View style={styles.memoContainer}>
              <Text style={styles.selectAddressText}>{s.strings.fio_sender_memo_label}:</Text>
              <Text style={styles.selectAddressTextPressed}>{memo || s.strings.fio_sender_memo_placeholder}</Text>
            </View>
          </TouchableWithoutFeedback>
        )}
        {memoError ? <Text style={styles.error}>{memoError}</Text> : null}
      </View>
    )
  }
}

const rawStyles = {
  selectContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectFullWidth: {
    width: '100%',
    paddingHorizontal: scale(30),
    paddingVertical: scale(10)
  },
  title: {
    fontSize: scale(28),
    color: THEME.COLORS.WHITE,
    marginTop: scale(20),
    marginBottom: scale(10)
  },
  text: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(16)
  },
  error: {
    color: THEME.COLORS.ACCENT_RED,
    fontSize: scale(12),
    width: '100%'
  },
  loading: {
    flex: 1,
    marginTop: scale(40),
    alignSelf: 'center'
  },
  selectAddressText: {
    color: THEME.COLORS.WHITE,
    fontSize: scale(14)
  },
  selectAddressTextPressed: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(14)
  },
  memoContainer: {
    marginTop: scale(10),
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  textIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: scale(18)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

const mapStateToProps = (state: RootState): SelectFioAddressProps => {
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  const fioWallets: EdgeCurrencyWallet[] = UI_SELECTORS.getFioWallets(state)
  const fioAddresses = state.ui.scenes.fioAddress.fioAddresses

  if (!guiWallet || !currencyCode) {
    return {
      loading: true,
      fioAddresses,
      fioWallets,
      currencyCode,
      selectedWallet: guiWallet
    }
  }

  return {
    loading: false,
    fioAddresses,
    fioWallets,
    currencyCode,
    selectedWallet: guiWallet
  }
}

const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  refreshAllFioAddresses: () => {
    dispatch(refreshAllFioAddresses())
  }
})

export const SelectFioAddressConnector = connect(mapStateToProps, mapDispatchToProps)(SelectFioAddress)
