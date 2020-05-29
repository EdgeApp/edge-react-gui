// @flow
import type { EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, TouchableWithoutFeedback, View } from 'react-native'
import { connect } from 'react-redux'

import { AddressModal } from '../../../components/modals/AddressModal'
import { TransactionDetailsNotesInput } from '../../../components/modals/TransactionDetailsNotesInput'
import { Airship, showError } from '../../../components/services/AirshipInstance'
import * as Constants from '../../../constants/indexConstants'
import s from '../../../locales/strings.js'
import { MaterialInput } from '../../../styles/components/FormFieldStyles.js'
import { styles as CryptoExchangeSceneStyle } from '../../../styles/scenes/CryptoExchangeSceneStyles'
import { styles } from '../../../styles/scenes/FioRequestConfirmationStyle'
import type { State } from '../../../types/reduxTypes'
import type { FioRequest, GuiWallet } from '../../../types/types'
import { TextAndIconButton } from '../../UI/components/Buttons/TextAndIconButton.ui.js'
import Text from '../../UI/components/FormattedText/FormattedText.ui.js'
import * as UI_SELECTORS from '../../UI/selectors.js'
import { checkRecordSendFee, findWalletByFioAddress } from '../util'

export type SelectFioAddressOwnProps = {
  selected: string,
  memo: string,
  memoError: string,
  onSelect: (fioAddress: string, fioWallet: EdgeCurrencyWallet, error: string) => void,
  onMemoChange: (memo: string, memoError: string) => void,
  fioRequest: FioRequest | null,
  isSendUsingFioAddress: boolean | null
}

export type SelectFioAddressProps = {
  loading: boolean,
  fioWallets: EdgeCurrencyWallet[],
  selectedWallet: GuiWallet,
  currencyCode: string
}

type Props = SelectFioAddressOwnProps & SelectFioAddressProps

type LocalState = {
  loading: boolean
}

class SelectFioAddress extends Component<Props, LocalState> {
  MaterialInputStyle = {}
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  componentDidMount() {
    const { fioRequest, isSendUsingFioAddress } = this.props
    if (fioRequest) {
      this.setFioAddress(fioRequest.payer_fio_address)
    } else if (isSendUsingFioAddress) {
      this.setDefaultFioAddress()
    }

    const materialStyle = { ...MaterialInput }
    materialStyle.tintColor = styles.text.color
    materialStyle.baseColor = styles.text.color
    this.MaterialInputStyle = {
      ...materialStyle,
      container: {
        ...materialStyle.container,
        width: styles.selectFullWidth.width
      },
      titleTextStyle: styles.title
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
    const { fioWallets } = this.props
    if (!fioWallet) {
      fioWallet = await findWalletByFioAddress(fioWallets, fioAddress)
    }
    let error = ''

    if (!fioWallet) {
      error = s.strings.fio_select_address_no_wallet_err
      showError(error)
      return
    }

    try {
      await checkRecordSendFee(fioWallet, fioAddress)
    } catch (e) {
      error = e.message
      showError(e.message)
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

    if (loading) return <ActivityIndicator style={styles.loading} size="small" />

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
      <View>
        <TextAndIconButton
          style={{
            ...CryptoExchangeSceneStyle.flipWrapper.walletSelector,
            text: styles.selectAddressText,
            textPressed: styles.selectAddressTextPressed,
            container: styles.selectAddressContainer
          }}
          onPress={this.selectAddress}
          icon={Constants.KEYBOARD_ARROW_DOWN}
          title={`${s.strings.fragment_send_from_label}: ${selected}`}
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
          <ActivityIndicator style={styles.loading} size="small" />
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

const mapStateToProps = (state: State): SelectFioAddressProps => {
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  const fioWallets: EdgeCurrencyWallet[] = UI_SELECTORS.getFioWallets(state)

  if (!guiWallet || !currencyCode) {
    return {
      loading: true,
      fioWallets,
      currencyCode,
      selectedWallet: guiWallet
    }
  }

  return {
    loading: false,
    fioWallets,
    currencyCode,
    selectedWallet: guiWallet
  }
}

export const SelectFioAddressConnector = connect(mapStateToProps, {})(SelectFioAddress)
