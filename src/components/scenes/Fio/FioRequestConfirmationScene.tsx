import { div, mul } from 'biggystring'
import { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { formatNumber } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { CcWalletMap } from '../../../reducers/FioReducer'
import { getDisplayDenomination, getExchangeDenomination } from '../../../selectors/DenominationSelectors'
import { getExchangeRate, getSelectedCurrencyWallet } from '../../../selectors/WalletSelectors'
import { connect } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { emptyCurrencyInfo, GuiCurrencyInfo, GuiDenomination } from '../../../types/types'
import {
  addToFioAddressCache,
  checkPubAddress,
  convertEdgeToFIOCodes,
  fioMakeSpend,
  fioSignAndBroadcast,
  getRemainingBundles
} from '../../../util/FioAddressUtils'
import { DECIMAL_PRECISION, getDenomFromIsoCode } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { AddressModal } from '../../modals/AddressModal'
import { ButtonsModal } from '../../modals/ButtonsModal'
import { TextInputModal } from '../../modals/TextInputModal'
import { Airship, showError, showToast } from '../../services/AirshipInstance'
import { cacheStyles, Theme, ThemeProps, withTheme } from '../../services/ThemeContext'
import { Slider } from '../../themed/Slider'
import { Tile } from '../../tiles/Tile'

interface StateProps {
  exchangeSecondaryToPrimaryRatio: string
  edgeWallet: EdgeCurrencyWallet
  chainCode: string
  primaryCurrencyInfo: GuiCurrencyInfo
  secondaryCurrencyInfo: GuiCurrencyInfo
  fioWallets: EdgeCurrencyWallet[]
  account: EdgeAccount
  isConnected: boolean
  fioPlugin?: EdgeCurrencyConfig
  walletId: string
  currencyCode: string
  connectedWalletsByFioAddress: {
    [fioAddress: string]: CcWalletMap
  }
}

interface OwnProps extends EdgeSceneProps<'fioRequestConfirmation'> {}

type Props = StateProps & ThemeProps & OwnProps

interface State {
  loading: boolean
  walletAddresses: Array<{ fioAddress: string; fioWallet: EdgeCurrencyWallet }>
  fioAddressFrom: string
  fioAddressTo: string
  memo: string
  settingFioAddressTo: boolean
  showSlider: boolean
}

export class FioRequestConfirmationConnected extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      fioAddressFrom: '',
      walletAddresses: [],
      fioAddressTo: this.props.route.params.fioAddressTo,
      memo: '',
      settingFioAddressTo: false,
      showSlider: true
    }
  }

  componentDidMount() {
    this.setAddressesState().catch(err => showError(err))
  }

  setAddressesState = async () => {
    if (this.props.fioWallets) {
      const { chainCode, currencyCode, connectedWalletsByFioAddress } = this.props
      const walletAddresses = []
      let defaultFioAddressFrom = null
      for (const fioWallet of this.props.fioWallets) {
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
        } catch (e: any) {
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
    const { fioPlugin, primaryCurrencyInfo, isConnected, edgeWallet, chainCode, account, navigation, route } = this.props
    const { amounts } = route.params
    const { walletAddresses, fioAddressFrom } = this.state
    const walletAddress = walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)
    const { publicAddress } = await edgeWallet.getReceiveAddress()

    if (walletAddress && fioPlugin) {
      const { fioWallet } = walletAddress
      const val = div(amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, DECIMAL_PRECISION)
      try {
        if (!isConnected) {
          showError(lstrings.fio_network_alert_text)
          return
        }
        // checking fee
        this.setState({ loading: true })
        try {
          const edgeTx = await fioMakeSpend(fioWallet, 'requestFunds', {
            payerFioAddress: '',
            payeeFioAddress: this.state.fioAddressFrom,
            payeeTokenPublicAddress: '',
            payerFioPublicKey: '',
            amount: '',
            chainCode: '',
            tokenCode: '',
            memo: ''
          })
          const bundledTxs = await getRemainingBundles(fioWallet, this.state.fioAddressFrom)
          // The API only returns a fee if there are 0 bundled transactions remaining. New requests can cost up to two transactions
          // so we need to check the corner case where a user might have one remaining transaction.
          if (edgeTx.networkFee !== '0' || bundledTxs < 2) {
            this.setState({ loading: false })
            this.resetSlider()
            const answer = await Airship.show<'ok' | undefined>(bridge => (
              <ButtonsModal
                bridge={bridge}
                title={lstrings.fio_no_bundled_err_msg}
                message={lstrings.fio_no_bundled_add_err_msg}
                buttons={{
                  ok: { label: lstrings.title_fio_add_bundled_txs }
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
        } catch (e: any) {
          this.setState({ loading: false })
          this.resetSlider()
          return showError(lstrings.fio_get_fee_err_msg)
        }

        let payerPublicKey
        try {
          const fioCurrencyCode = fioPlugin.currencyInfo.currencyCode
          payerPublicKey = await checkPubAddress(fioPlugin, this.state.fioAddressTo, fioCurrencyCode, fioCurrencyCode)
        } catch (e: any) {
          console.log(e)
        }

        const { fioChainCode, fioTokenCode } = convertEdgeToFIOCodes(edgeWallet.currencyInfo.pluginId, chainCode, primaryCurrencyInfo.exchangeCurrencyCode)

        // send fio request
        const edgeTx = await fioMakeSpend(fioWallet, 'requestFunds', {
          payerFioAddress: this.state.fioAddressTo,
          payeeFioAddress: this.state.fioAddressFrom,
          payerFioPublicKey: payerPublicKey,
          payeeTokenPublicAddress: publicAddress,
          amount: val,
          tokenCode: fioTokenCode,
          chainCode: fioChainCode,
          memo: this.state.memo
        })
        await fioSignAndBroadcast(fioWallet, edgeTx)
        this.setState({ loading: false })
        showToast(lstrings.fio_request_ok_body)
        await addToFioAddressCache(account, [this.state.fioAddressTo])
        navigation.navigate('request', {})
      } catch (error: any) {
        this.setState({ loading: false })
        this.resetSlider()
        showError(
          `${lstrings.fio_request_error_header}. ${error.json && error.json.fields && error.json.fields[0] ? JSON.stringify(error.json.fields[0].error) : ''}`
        )
      }
    } else {
      showError(lstrings.fio_wallet_missing_for_fio_address)
    }
  }

  onAddressFromPressed = async () => {
    await this.openFioAddressFromModal()
  }

  onAddressToPressed = async () => {
    await this.openFioAddressToModal()
  }

  onMemoPressed = async () => {
    await this.openMemoModal()
  }

  openFioAddressFromModal = async () => {
    const { fioPlugin, walletId, currencyCode } = this.props
    const { walletAddresses } = this.state
    const fioAddressFrom = await Airship.show<string | undefined>(bridge => (
      <AddressModal bridge={bridge} walletId={walletId} currencyCode={currencyCode} title={lstrings.fio_confirm_request_fio_title} useUserFioAddressesOnly />
    ))
    if (fioAddressFrom == null) return
    if (fioPlugin && !(await fioPlugin.otherMethods.doesAccountExist(fioAddressFrom)))
      return showError(`${lstrings.send_fio_request_error_addr_not_exist}${fioAddressFrom ? '\n' + fioAddressFrom : ''}`)
    if (!walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)) return showError(lstrings.fio_wallet_missing_for_fio_address) // Check if valid owned fio address
    if (fioAddressFrom === this.state.fioAddressTo) return showError(lstrings.fio_confirm_request_error_from_same)
    this.setState({ fioAddressFrom })
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
    const fioAddressTo = await Airship.show<string | undefined>(bridge => (
      <AddressModal bridge={bridge} walletId={walletId} currencyCode={currencyCode} title={lstrings.fio_confirm_request_fio_title} isFioOnly />
    ))
    if (fioAddressTo == null) {
      this.showError()
    } else if (fioPlugin && !(await fioPlugin.otherMethods.doesAccountExist(fioAddressTo))) {
      this.showError(`${lstrings.send_fio_request_error_addr_not_exist}${fioAddressTo ? '\n' + fioAddressTo : ''}`)
    } else if (this.state.fioAddressFrom === fioAddressTo) {
      this.showError(lstrings.fio_confirm_request_error_to_same)
    } else {
      this.setState({ fioAddressTo, settingFioAddressTo: false })
    }
  }

  openMemoModal = async () => {
    const memo = await Airship.show<string | undefined>(bridge => (
      <TextInputModal
        bridge={bridge}
        initialValue={this.state.memo}
        inputLabel={lstrings.fio_confirm_request_memo}
        returnKeyType="done"
        multiline
        submitLabel={lstrings.string_save}
        title={lstrings.fio_confirm_request_input_title_memo}
      />
    ))
    if (memo == null) return
    if (memo.length > 64) return showError(lstrings.send_fio_request_error_memo_inline)
    if (memo && !/^[\x20-\x7E\x85\n]*$/.test(memo)) return showError(lstrings.send_fio_request_error_memo_invalid_character)
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
    } catch (e: any) {
      return null
    }

    const styles = getStyles(theme)

    const fiatAmount = formatNumber(mul(exchangeSecondaryToPrimaryRatio, exchangeAmount), { toFixed: 2 }) || '0'
    const cryptoName = primaryCurrencyInfo.displayDenomination.name
    const fiatName = secondaryCurrencyInfo.displayDenomination.name

    return (
      <SceneWrapper background="theme">
        <Tile type="editable" title={lstrings.fio_confirm_request_from} body={fioAddressFrom} onPress={this.onAddressFromPressed} />
        <Tile
          type="editable"
          title={lstrings.fio_confirm_request_to}
          body={settingFioAddressTo ? lstrings.resolving : fioAddressTo}
          onPress={this.onAddressToPressed}
        />
        <Tile type="static" title={lstrings.fio_confirm_request_amount} body={`${cryptoAmount} ${cryptoName} (${fiatAmount} ${fiatName})`} />
        <Tile type="editable" title={lstrings.fio_confirm_request_memo} body={memo} onPress={this.onMemoPressed} />
        <View style={styles.sliderContainer}>
          {fioAddressFrom.length > 0 && fioAddressTo.length > 0 && showSlider ? (
            <Slider onSlidingComplete={this.onConfirm} disabled={loading} showSpinner={loading} disabledText={lstrings.loading} />
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
    const selectedWallet: EdgeCurrencyWallet = getSelectedCurrencyWallet(state)
    const { account } = state.core
    const currencyCode: string = state.ui.wallets.selectedCurrencyCode
    const fioWallets: EdgeCurrencyWallet[] = state.ui.wallets.fioWallets
    const { isConnected } = state.network

    if (!currencyCode) {
      return {
        exchangeSecondaryToPrimaryRatio: '0',
        chainCode: '',
        primaryCurrencyInfo: emptyCurrencyInfo,
        secondaryCurrencyInfo: emptyCurrencyInfo,
        edgeWallet: selectedWallet,
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
    const secondaryExchangeDenomination: GuiDenomination = getDenomFromIsoCode(selectedWallet.fiatCurrencyCode.replace('iso:', ''))
    const secondaryDisplayDenomination: GuiDenomination = secondaryExchangeDenomination
    const primaryExchangeCurrencyCode: string = primaryExchangeDenomination.name
    const secondaryExchangeCurrencyCode: string = secondaryExchangeDenomination.name ? secondaryExchangeDenomination.name : ''

    const primaryCurrencyInfo: GuiCurrencyInfo = {
      walletId: state.ui.wallets.selectedWalletId,
      displayCurrencyCode: currencyCode,
      displayDenomination: primaryDisplayDenomination,
      exchangeCurrencyCode: primaryExchangeCurrencyCode,
      exchangeDenomination: primaryExchangeDenomination
    }
    const secondaryCurrencyInfo: GuiCurrencyInfo = {
      walletId: state.ui.wallets.selectedWalletId,
      displayCurrencyCode: selectedWallet.fiatCurrencyCode.replace('iso:', ''),
      displayDenomination: secondaryDisplayDenomination,
      exchangeCurrencyCode: secondaryExchangeCurrencyCode,
      exchangeDenomination: secondaryExchangeDenomination
    }
    const isoFiatCurrencyCode: string = selectedWallet.fiatCurrencyCode
    const exchangeSecondaryToPrimaryRatio = getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

    return {
      exchangeSecondaryToPrimaryRatio,
      edgeWallet: selectedWallet,
      chainCode: selectedWallet.currencyInfo.currencyCode,
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
