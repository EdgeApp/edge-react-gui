// @flow

import { div, mul } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js/src/types/types'
import * as React from 'react'
import { View } from 'react-native'

import { formatNumber } from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { addToFioAddressCache, checkPubAddress, getRemainingBundles } from '../../modules/FioAddress/util'
import { Slider } from '../../modules/UI/components/Slider/Slider'
import type { CcWalletMap } from '../../reducers/FioReducer'
import { getDisplayDenomination, getExchangeDenomination } from '../../selectors/DenominationSelectors.js'
import { getExchangeRate, getSelectedCurrencyWallet, getSelectedWallet } from '../../selectors/WalletSelectors'
import { connect } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types'
import { emptyCurrencyInfo } from '../../types/types'
import { DECIMAL_PRECISION, getDenomFromIsoCode } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { AddressModal } from '../modals/AddressModal.js'
import { ButtonsModal } from '../modals/ButtonsModal'
import { TextInputModal } from '../modals/TextInputModal.js'
import { Airship, showError, showToast } from '../services/AirshipInstance'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Tile } from '../themed/Tile'

type StateProps = {
  exchangeSecondaryToPrimaryRatio: string,
  publicAddress: string,
  chainCode: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  fioWallets: EdgeCurrencyWallet[],
  account: EdgeAccount,
  isConnected: boolean,
  fioPlugin?: EdgeCurrencyConfig,
  walletId: string,
  currencyCode: string,
  connectedWalletsByFioAddress: {
    [fioAddress: string]: CcWalletMap
  }
}

type OwnProps = {
  navigation: NavigationProp<'fioRequestConfirmation'>,
  route: RouteProp<'fioRequestConfirmation'>
}

type Props = StateProps & ThemeProps & OwnProps

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
      const { chainCode, currencyCode, connectedWalletsByFioAddress } = this.props
      const walletAddresses = []
      let defaultFioAddressFrom = null
      for (const fioWallet: EdgeCurrencyWallet of this.props.fioWallets) {
        try {
          const fioAddresses: string[] = await fioWallet.otherMethods.getFioAddressNames()
          if (fioAddresses.length > 0) {
            for (const fioAddress of fioAddresses) {
              walletAddresses.push({ fioAddress, fioWallet })
              if (defaultFioAddressFrom == null && connectedWalletsByFioAddress[fioAddress]?.[`${chainCode}:${currencyCode}`] === this.props.walletId) {
                defaultFioAddressFrom = fioAddress
              }
            }
          }
        } catch (e) {
          continue
        }
      }

      this.setState({
        walletAddresses,
        fioAddressFrom: defaultFioAddressFrom != null ? defaultFioAddressFrom : walletAddresses[0].fioAddress
      })
    }
  }

  resetSlider = (): void => {
    this.setState({ showSlider: false }, () => this.setState({ showSlider: true }))
  }

  onConfirm = async () => {
    const { fioPlugin, primaryCurrencyInfo, isConnected, publicAddress, chainCode, account, navigation, route } = this.props
    const { amounts } = route.params
    const { walletAddresses, fioAddressFrom } = this.state
    const walletAddress = walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)

    if (walletAddress && fioPlugin) {
      const { fioWallet } = walletAddress
      const val = div(amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      try {
        if (!isConnected) {
          showError(s.strings.fio_network_alert_text)
          return
        }
        // checking fee
        this.setState({ loading: true })
        try {
          const getFeeRes = await fioWallet.otherMethods.fioAction('getFee', { endPoint: 'new_funds_request', fioAddress: this.state.fioAddressFrom })
          const bundledTxs = await getRemainingBundles(fioWallet, this.state.fioAddressFrom)
          // The API only returns a fee if there are 0 bundled transactions remaining. New requests can cost up to two transactions
          // so we need to check the corner case where a user might have one remaining transaction.
          if (getFeeRes.fee || bundledTxs < 2) {
            this.setState({ loading: false })
            this.resetSlider()
            const answer = await Airship.show(bridge => (
              <ButtonsModal
                bridge={bridge}
                title={s.strings.fio_no_bundled_err_msg}
                message={s.strings.fio_no_bundled_add_err_msg}
                buttons={{
                  ok: { label: s.strings.title_fio_add_bundled_txs }
                }}
                closeArrow
              />
            ))
            if (answer === 'ok') {
              navigation.navigate('fioAddressSettings', {
                showAddBundledTxs: true,
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
          payeeTokenPublicAddress: publicAddress,
          amount: val,
          tokenCode: primaryCurrencyInfo.exchangeCurrencyCode,
          chainCode: chainCode || primaryCurrencyInfo.exchangeCurrencyCode,
          memo: this.state.memo,
          maxFee: 0
        })
        this.setState({ loading: false })
        showToast(s.strings.fio_request_ok_body)
        addToFioAddressCache(account, [this.state.fioAddressTo])
        navigation.navigate('request')
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
    const { fioPlugin, walletId, currencyCode } = this.props
    const { walletAddresses } = this.state
    const fioAddressFrom = await Airship.show(bridge => (
      <AddressModal bridge={bridge} walletId={walletId} currencyCode={currencyCode} title={s.strings.fio_confirm_request_fio_title} useUserFioAddressesOnly />
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
    const { fioPlugin, walletId, currencyCode } = this.props

    this.setState({ settingFioAddressTo: true })
    const fioAddressTo = await Airship.show(bridge => (
      <AddressModal bridge={bridge} walletId={walletId} currencyCode={currencyCode} title={s.strings.fio_confirm_request_fio_title} isFioOnly />
    ))
    if (fioAddressTo === null) {
      this.showError()
    } else if (fioPlugin && !(await fioPlugin.otherMethods.doesAccountExist(fioAddressTo))) {
      this.showError(`${s.strings.send_fio_request_error_addr_not_exist}${fioAddressTo ? '\n' + fioAddressTo : ''}`)
    } else if (this.state.fioAddressFrom === fioAddressTo) {
      this.showError(s.strings.fio_confirm_request_error_to_same)
    } else {
      this.setState({ fioAddressTo: fioAddressTo || '', settingFioAddressTo: false })
    }
  }

  openMemoModal = async () => {
    const memo = await Airship.show(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.memo}
        inputLabel={s.strings.fio_confirm_request_memo}
        returnKeyType="done"
        multiline
        submitLabel={s.strings.string_save}
        title={s.strings.fio_confirm_request_input_title_memo}
      />
    ))
    if (memo == null) return
    if (memo.length > 64) return showError(s.strings.send_fio_request_error_memo_inline)
    if (memo && !/^[\x20-\x7E\x85\n]*$/.test(memo)) return showError(s.strings.send_fio_request_error_memo_invalid_character)
    this.setState({ memo })
  }

  render() {
    const { primaryCurrencyInfo, secondaryCurrencyInfo, theme, exchangeSecondaryToPrimaryRatio, route } = this.props
    const { amounts } = route.params

    const { fioAddressFrom, fioAddressTo, loading, memo, settingFioAddressTo, showSlider } = this.state

    if (!primaryCurrencyInfo || !secondaryCurrencyInfo) return null
    let cryptoAmount, exchangeAmount
    try {
      cryptoAmount = div(amounts.nativeAmount, primaryCurrencyInfo.displayDenomination.multiplier, DECIMAL_PRECISION)
      exchangeAmount = div(amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
    } catch (e) {
      return null
    }

    const styles = getStyles(theme)

    const fiatAmount = formatNumber(mul(exchangeSecondaryToPrimaryRatio, exchangeAmount), { toFixed: 2 }) || '0'
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

export const FioRequestConfirmationScene = connect<StateProps, {}, OwnProps>(
  state => {
    const guiWallet: GuiWallet = getSelectedWallet(state)
    const selectedWallet: EdgeCurrencyWallet = getSelectedCurrencyWallet(state)
    const { account } = state.core
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode
    const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
    const { isConnected } = state.network

    if (!guiWallet || !currencyCode) {
      return {
        exchangeSecondaryToPrimaryRatio: '0',
        chainCode: '',
        primaryCurrencyInfo: emptyCurrencyInfo,
        secondaryCurrencyInfo: emptyCurrencyInfo,
        publicAddress: '',
        fioWallets,
        account,
        isConnected,
        walletId: '',
        currencyCode: '',
        fioPlugin: account.currencyConfig.fio,
        connectedWalletsByFioAddress: {}
      }
    }

    const primaryDisplayDenomination: GuiDenomination = getDisplayDenomination(state, selectedWallet.currencyInfo.pluginId, currencyCode)
    const primaryExchangeDenomination: GuiDenomination = getExchangeDenomination(state, selectedWallet.currencyInfo.pluginId, currencyCode)
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
      fioPlugin: account.currencyConfig.fio,
      connectedWalletsByFioAddress: state.ui.fio.connectedWalletsByFioAddress
    }
  },
  dispatch => ({})
)(withTheme(FioRequestConfirmationConnected))
