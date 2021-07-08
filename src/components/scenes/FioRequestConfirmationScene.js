// @flow

import { bns } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js/src/types/types'
import * as React from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import { FIO_ADDRESS_SETTINGS, REQUEST } from '../../constants/SceneKeys.js'
import { CURRENCY_PLUGIN_NAMES } from '../../constants/WalletAndCurrencyConstants.js'
import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { addToFioAddressCache, checkExpiredFioAddress, checkPubAddress } from '../../modules/FioAddress/util'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import { getDisplayDenomination, getPrimaryExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { getExchangeRate, getSelectedWallet } from '../../selectors/WalletSelectors.js'
import { type RootState } from '../../types/reduxTypes'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types'
import { emptyCurrencyInfo } from '../../types/types'
import { getDenomFromIsoCode } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { AddressModal } from '../modals/AddressModal.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { TransactionDetailsNotesInput } from '../modals/TransactionDetailsNotesInput.js'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import type { ExchangedFlipInputAmounts } from '../themed/ExchangedFlipInput'
import { Tile } from '../themed/Tile'

type StateProps = {
  exchangeSecondaryToPrimaryRatio: number,
  publicAddress: string,
  chainCode: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  fioWallets: EdgeCurrencyWallet[],
  account: EdgeAccount,
  isConnected: boolean,
  fioPlugin?: EdgeCurrencyConfig,
  walletId: string,
  currencyCode: string
}

type NavigationProps = {
  amounts: ExchangedFlipInputAmounts
}

type Props = StateProps & NavigationProps & ThemeProps

type State = {
  loading: boolean,
  walletAddresses: Array<{ fioAddress: string, fioWallet: EdgeCurrencyWallet }>,
  fioAddressFrom: string,
  fioAddressTo: string,
  memo: string,
  settingFioAddressTo: boolean,
  showSlider: boolean
}

export class FioRequestConfirmationConnected extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      fioAddressFrom: '',
      walletAddresses: [],
      fioAddressTo: '',
      memo: '',
      settingFioAddressTo: false,
      showSlider: true
    }
  }

  componentDidMount() {
    this.setAddressesState()
    this.openFioAddressToModal()
  }

  setAddressesState = async () => {
    if (this.props.fioWallets) {
      const walletAddresses = []
      for (const fioWallet: EdgeCurrencyWallet of this.props.fioWallets) {
        try {
          const fioAddresses: string[] = await fioWallet.otherMethods.getFioAddressNames()
          if (fioAddresses.length > 0) {
            for (const fioAddress of fioAddresses) {
              walletAddresses.push({ fioAddress, fioWallet })
            }
          }
        } catch (e) {
          continue
        }
      }

      this.setState({
        walletAddresses,
        fioAddressFrom: walletAddresses[0].fioAddress
      })
    }
  }

  resetSlider = (): void => {
    this.setState({ showSlider: false }, () => this.setState({ showSlider: true }))
  }

  onConfirm = async () => {
    const { fioPlugin } = this.props
    const { walletAddresses, fioAddressFrom } = this.state
    const walletAddress = walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)

    if (walletAddress && fioPlugin) {
      const { fioWallet } = walletAddress
      const val = bns.div(this.props.amounts.nativeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
      try {
        if (!this.props.isConnected) {
          showError(s.strings.fio_network_alert_text)
          return
        }
        // checking fee
        this.setState({ loading: true })
        try {
          const getFeeRes = await fioWallet.otherMethods.fioAction('getFee', { endPoint: 'new_funds_request', fioAddress: this.state.fioAddressFrom })
          if (getFeeRes.fee) {
            this.setState({ loading: false })
            this.resetSlider()
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
              Actions[FIO_ADDRESS_SETTINGS]({
                showRenew: true,
                fioWallet,
                fioAddressName: this.state.fioAddressFrom
              })
            }
            return
          }
        } catch (e) {
          this.setState({ loading: false })
          this.resetSlider()
          return showError(s.strings.fio_get_fee_err_msg)
        }

        let payerPublicKey
        try {
          const fioCurrencyCode = fioPlugin.currencyInfo.currencyCode
          payerPublicKey = await checkPubAddress(fioPlugin, this.state.fioAddressTo, fioCurrencyCode, fioCurrencyCode)
        } catch (e) {
          console.log(e)
        }

        // send fio request
        await fioWallet.otherMethods.fioAction('requestFunds', {
          payerFioAddress: this.state.fioAddressTo,
          payeeFioAddress: this.state.fioAddressFrom,
          payerFioPublicKey: payerPublicKey,
          payeeTokenPublicAddress: this.props.publicAddress,
          amount: val,
          tokenCode: this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          chainCode: this.props.chainCode || this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          memo: this.state.memo,
          maxFee: 0
        })
        this.setState({ loading: false })
        showToast(s.strings.fio_request_ok_body)
        addToFioAddressCache(this.props.account, [this.state.fioAddressTo])
        Actions.popTo(REQUEST)
      } catch (error) {
        this.setState({ loading: false })
        this.resetSlider()
        showError(
          `${s.strings.fio_request_error_header}. ${error.json && error.json.fields && error.json.fields[0] ? JSON.stringify(error.json.fields[0].error) : ''}`
        )
      }
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  onAddressFromPressed = () => {
    this.openFioAddressFromModal()
  }

  onAddressToPressed = () => {
    this.openFioAddressToModal()
  }

  onMemoPressed = () => {
    this.openMemoModal()
  }

  openFioAddressFromModal = async () => {
    const { fioPlugin } = this.props
    const { walletAddresses } = this.state
    const fioAddressFrom = await Airship.show(bridge => (
      <AddressModal
        bridge={bridge}
        walletId={this.props.walletId}
        currencyCode={this.props.currencyCode}
        title={s.strings.fio_confirm_request_fio_title}
        subtitle={s.strings.fio_confirm_request_fio_subtitle_from}
        useUserFioAddressesOnly
      />
    ))
    if (fioAddressFrom === null) return
    if (fioPlugin && !(await fioPlugin.otherMethods.doesAccountExist(fioAddressFrom)))
      return showError(`${s.strings.send_fio_request_error_addr_not_exist}${fioAddressFrom ? '\n' + fioAddressFrom : ''}`)
    if (!walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)) return showError(s.strings.fio_wallet_missing_for_fio_address) // Check if valid owned fio address
    if (fioAddressFrom === this.state.fioAddressTo) return showError(s.strings.fio_confirm_request_error_from_same)
    this.setState({ fioAddressFrom: fioAddressFrom || '' })
  }

  showError(error?: string) {
    this.setState({ settingFioAddressTo: false })
    if (error != null) {
      showError(error)
    }
  }

  openFioAddressToModal = async () => {
    this.setState({ settingFioAddressTo: true })
    const fioAddressTo = await Airship.show(bridge => (
      <AddressModal
        bridge={bridge}
        walletId={this.props.walletId}
        currencyCode={this.props.currencyCode}
        title={s.strings.fio_confirm_request_fio_title}
        subtitle={s.strings.fio_confirm_request_fio_subtitle_to}
        isFioOnly
      />
    ))
    if (fioAddressTo === null) {
      this.showError()
    } else if (await checkExpiredFioAddress(this.props.fioWallets[0], fioAddressTo ?? '')) {
      this.showError(s.strings.fio_address_expired)
    } else if (this.props.fioPlugin && !(await this.props.fioPlugin.otherMethods.doesAccountExist(fioAddressTo))) {
      this.showError(`${s.strings.send_fio_request_error_addr_not_exist}${fioAddressTo ? '\n' + fioAddressTo : ''}`)
    } else if (this.state.fioAddressFrom === fioAddressTo) {
      this.showError(s.strings.fio_confirm_request_error_to_same)
    } else {
      this.setState({ fioAddressTo: fioAddressTo || '', settingFioAddressTo: false })
    }
  }

  openMemoModal = async () => {
    const memo = await Airship.show(bridge => (
      <TransactionDetailsNotesInput bridge={bridge} title={s.strings.fio_confirm_request_input_title_memo} notes={this.state.memo} />
    ))

    if (memo.length > 64) return showError(s.strings.send_fio_request_error_memo_inline)
    if (memo && !/^[\x20-\x7E\x85\n]*$/.test(memo)) return showError(s.strings.send_fio_request_error_memo_invalid_character)
    this.setState({ memo })
  }

  render() {
    const { primaryCurrencyInfo, secondaryCurrencyInfo, theme } = this.props
    const { fioAddressFrom, fioAddressTo, loading, memo, settingFioAddressTo, showSlider } = this.state

    if (!primaryCurrencyInfo || !secondaryCurrencyInfo) return null
    let cryptoAmount, exchangeAmount
    try {
      cryptoAmount = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.displayDenomination.multiplier, 18)
      exchangeAmount = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
    } catch (e) {
      return null
    }

    const styles = getStyles(theme)

    const fiatAmount = formatNumber(this.props.exchangeSecondaryToPrimaryRatio * parseFloat(exchangeAmount), { toFixed: 2 }) || '0'
    const cryptoName = primaryCurrencyInfo.displayDenomination.name
    const fiatName = secondaryCurrencyInfo.displayDenomination.name

    return (
      <SceneWrapper background="theme">
        <Tile type="editable" title={s.strings.fio_confirm_request_from} body={fioAddressFrom} onPress={this.onAddressFromPressed} />
        <Tile
          type="editable"
          title={s.strings.fio_confirm_request_to}
          body={settingFioAddressTo ? s.strings.resolving : fioAddressTo}
          onPress={this.onAddressToPressed}
        />
        <Tile type="static" title={s.strings.fio_confirm_request_amount} body={`${cryptoAmount} ${cryptoName} (${fiatAmount} ${fiatName})`} />
        <Tile type="editable" title={s.strings.fio_confirm_request_memo} body={memo} onPress={this.onMemoPressed} />
        <View style={styles.sliderContainer}>
          {fioAddressFrom.length > 0 && fioAddressTo.length > 0 && showSlider ? (
            <Slider onSlidingComplete={this.onConfirm} disabled={loading} showSpinner={loading} disabledText={s.strings.loading} />
          ) : null}
        </View>
      </SceneWrapper>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  sliderContainer: {
    marginTop: theme.rem(2)
  }
}))

const FioRequestConfirmationScene = connect((state: RootState): StateProps => {
  const guiWallet: GuiWallet = getSelectedWallet(state)
  const { account } = state.core
  const currencyCode: string = state.ui.wallets.selectedCurrencyCode
  const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
  const { isConnected } = state.network

  if (!guiWallet || !currencyCode) {
    return {
      exchangeSecondaryToPrimaryRatio: 0,
      chainCode: '',
      primaryCurrencyInfo: emptyCurrencyInfo,
      secondaryCurrencyInfo: emptyCurrencyInfo,
      publicAddress: '',
      fioWallets,
      account,
      isConnected,
      walletId: '',
      currencyCode: '',
      fioPlugin: account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO]
    }
  }

  const primaryDisplayDenomination: GuiDenomination = getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = getPrimaryExchangeDenomination(state, currencyCode)
  const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(guiWallet.fiatCurrencyCode)
  const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
  const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
  const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.name ? secondaryExchangeDenomination.name : ''

  const primaryCurrencyInfo: GuiCurrencyInfo = {
    displayCurrencyCode: currencyCode,
    displayDenomination: primaryDisplayDenomination,
    exchangeCurrencyCode: primaryExchangeCurrencyCode,
    exchangeDenomination: primaryExchangeDenomination
  }
  const secondaryCurrencyInfo: GuiCurrencyInfo = {
    displayCurrencyCode: guiWallet.fiatCurrencyCode,
    displayDenomination: secondaryDisplayDenomination,
    exchangeCurrencyCode: secondaryExchangeCurrencyCode,
    exchangeDenomination: secondaryExchangeDenomination
  }
  const isoFiatCurrencyCode: string = guiWallet.isoFiatCurrencyCode
  const exchangeSecondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

  return {
    exchangeSecondaryToPrimaryRatio,
    publicAddress: guiWallet.receiveAddress.publicAddress || '',
    chainCode: guiWallet.currencyCode,
    primaryCurrencyInfo,
    secondaryCurrencyInfo,
    fioWallets,
    account,
    isConnected,
    walletId: state.ui.wallets.selectedWalletId,
    currencyCode: state.ui.wallets.selectedCurrencyCode,
    fioPlugin: account.currencyConfig[CURRENCY_PLUGIN_NAMES.FIO]
  }
})(withTheme(FioRequestConfirmationConnected))
export { FioRequestConfirmationScene }
