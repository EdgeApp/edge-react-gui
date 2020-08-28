// @flow

import { bns } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyConfig, EdgeCurrencyWallet } from 'edge-core-js/src/types/types'
import * as React from 'react'
import { Image, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { connect } from 'react-redux'

import editIcon from '../../assets/images/transaction_details_icon.png'
import * as Constants from '../../constants/indexConstants'
import * as intl from '../../locales/intl.js'
import s from '../../locales/strings.js'
import { addToFioAddressCache } from '../../modules/FioAddress/util.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import Text from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { Slider } from '../../modules/UI/components/Slider/Slider.ui'
import * as UI_SELECTORS from '../../modules/UI/selectors.js'
import THEME from '../../theme/variables/airbitz'
import type { State as StateType } from '../../types/reduxTypes'
import type { GuiCurrencyInfo, GuiDenomination, GuiWallet } from '../../types/types'
import { emptyCurrencyInfo } from '../../types/types'
import { getDenomFromIsoCode } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { AddressModal } from '../modals/AddressModal.js'
import { TransactionDetailsNotesInput } from '../modals/TransactionDetailsNotesInput.js'
import { Airship, showError, showToast } from '../services/AirshipInstance'

type StateProps = {
  exchangeSecondaryToPrimaryRatio: number,
  publicAddress: string,
  chainCode: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  fioWallets: EdgeCurrencyWallet[],
  account: EdgeAccount,
  isConnected: boolean,
  fioPlugin: EdgeCurrencyConfig,
  walletId: string,
  currencyCode: string
}

type NavigationProps = {
  amounts: ExchangedFlipInputAmounts
}

type Props = StateProps & NavigationProps

type State = {
  loading: boolean,
  walletAddresses: { fioAddress: string, fioWallet: EdgeCurrencyWallet }[],
  fioAddressFrom: string,
  fioAddressTo: string,
  memo: string,
  settingFioAddressTo: boolean
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
      settingFioAddressTo: false
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

  onConfirm = async () => {
    const { walletAddresses, fioAddressFrom } = this.state
    const walletAddress = walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)

    if (walletAddress) {
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
          if (getFeeRes.fee) return showError(s.strings.fio_no_bundled_err_msg)
        } catch (e) {
          this.setState({ loading: false })
          return showError(s.strings.fio_get_fee_err_msg)
        }
        // send fio request
        await fioWallet.otherMethods.fioAction('requestFunds', {
          payerFioAddress: this.state.fioAddressTo,
          payeeFioAddress: this.state.fioAddressFrom,
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
        Actions.popTo(Constants.REQUEST)
      } catch (error) {
        this.setState({ loading: false })
        showError(
          `${s.strings.fio_request_error_header}. ${error.json && error.json.fields && error.json.fields[0] ? JSON.stringify(error.json.fields[0].error) : ''}`
        )
      }
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
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
    if (!(await fioPlugin.otherMethods.doesAccountExist(fioAddressFrom)))
      return showError(`${s.strings.send_fio_request_error_addr_not_exist}${fioAddressFrom ? '\n' + fioAddressFrom : ''}`)
    if (!walletAddresses.find(({ fioAddress }) => fioAddress === fioAddressFrom)) return showError(s.strings.fio_wallet_missing_for_fio_address) // Check if valid owned fio address
    if (fioAddressFrom === this.state.fioAddressTo) return showError(s.strings.fio_confirm_request_error_from_same)
    this.setState({ fioAddressFrom: fioAddressFrom || '' })
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
      this.setState({ settingFioAddressTo: false })
      return
    }
    if (!(await this.props.fioPlugin.otherMethods.doesAccountExist(fioAddressTo))) {
      this.setState({ settingFioAddressTo: false })
      return showError(`${s.strings.send_fio_request_error_addr_not_exist}${fioAddressTo ? '\n' + fioAddressTo : ''}`)
    }
    if (this.state.fioAddressFrom === fioAddressTo) {
      this.setState({ settingFioAddressTo: false })
      return showError(s.strings.fio_confirm_request_error_to_same)
    }
    this.setState({ fioAddressTo: fioAddressTo || '', settingFioAddressTo: false })
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
    const { primaryCurrencyInfo, secondaryCurrencyInfo } = this.props
    const { fioAddressFrom, fioAddressTo, loading, memo, settingFioAddressTo } = this.state
    if (!primaryCurrencyInfo || !secondaryCurrencyInfo) return null
    let cryptoAmount, exchangeAmount
    try {
      cryptoAmount = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.displayDenomination.multiplier, 18)
      exchangeAmount = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
    } catch (e) {
      return null
    }

    const fiatAmount = intl.formatNumber(this.props.exchangeSecondaryToPrimaryRatio * parseFloat(exchangeAmount), { toFixed: 2 }) || '0'
    const cryptoName = primaryCurrencyInfo.displayDenomination.name
    const fiatName = secondaryCurrencyInfo.displayDenomination.name

    return (
      <SceneWrapper>
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={this.openFioAddressFromModal}>
            <View style={styles.tileContainer}>
              <Image style={styles.tileIcon} source={editIcon} />
              <Text style={fioAddressFrom.length > 0 ? styles.tileTextHeader : styles.tileTextHeaderError}>{s.strings.fio_confirm_request_from}</Text>
              <Text style={styles.tileTextBody}>{fioAddressFrom}</Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={this.openFioAddressToModal}>
            <View style={styles.tileContainer}>
              <Image style={styles.tileIcon} source={editIcon} />
              <Text style={fioAddressTo.length > 0 ? styles.tileTextHeader : styles.tileTextHeaderError}>{s.strings.fio_confirm_request_to}</Text>
              <Text style={styles.tileTextBody}>{settingFioAddressTo ? s.strings.resolving : fioAddressTo}</Text>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.tileContainer}>
            <Text style={styles.tileTextHeader}>{s.strings.fio_confirm_request_amount}</Text>
            <Text style={styles.tileTextBody}>{`${cryptoAmount} ${cryptoName} (${fiatAmount} ${fiatName})`}</Text>
          </View>
          <TouchableWithoutFeedback onPress={this.openMemoModal}>
            <View style={styles.tileContainer}>
              <Image style={styles.tileIcon} source={editIcon} />
              <Text style={styles.tileTextHeader}>{s.strings.fio_confirm_request_memo}</Text>
              <Text style={styles.tileTextBody}>{memo}</Text>
            </View>
          </TouchableWithoutFeedback>
          {fioAddressFrom.length > 0 && fioAddressTo.length > 0 ? (
            <Slider
              resetSlider={false}
              parentStyle={styles.sliderStyle}
              onSlidingComplete={this.onConfirm}
              sliderDisabled={loading}
              showSpinner={loading}
              disabledText={s.strings.loading}
            />
          ) : null}
        </View>
      </SceneWrapper>
    )
  }
}

const FioRequestConfirmationScene = connect((state: StateType): StateProps => {
  const guiWallet: GuiWallet = UI_SELECTORS.getSelectedWallet(state)
  const { account } = state.core
  const currencyCode: string = UI_SELECTORS.getSelectedCurrencyCode(state)
  const fioWallets: EdgeCurrencyWallet[] = UI_SELECTORS.getFioWallets(state)
  const { isConnected } = state.network
  const fioPlugin = account.currencyConfig[Constants.CURRENCY_PLUGIN_NAMES.FIO]

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
      fioPlugin
    }
  }

  const primaryDisplayDenomination: GuiDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, currencyCode)
  const primaryExchangeDenomination: GuiDenomination = UI_SELECTORS.getExchangeDenomination(state, currencyCode)
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
  const exchangeSecondaryToPrimaryRatio = UI_SELECTORS.getExchangeRate(state, currencyCode, isoFiatCurrencyCode)

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
    fioPlugin
  }
})(FioRequestConfirmationConnected)
export { FioRequestConfirmationScene }

const { rem } = THEME
const tileStyles = {
  width: '100%',
  backgroundColor: THEME.COLORS.WHITE,
  borderBottomWidth: 1,
  borderBottomColor: THEME.COLORS.GRAY_3,
  padding: rem(0.5)
}

const rawStyles = {
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: THEME.COLORS.GRAY_4,
    alignItems: 'center'
  },
  tileContainer: {
    ...tileStyles
  },
  tileTextHeader: {
    color: THEME.COLORS.SECONDARY,
    fontSize: rem(0.75),
    margin: rem(0.25)
  },
  tileTextHeaderError: {
    color: THEME.COLORS.ACCENT_RED,
    fontSize: rem(0.75),
    margin: rem(0.25)
  },
  tileTextBody: {
    color: THEME.COLORS.GRAY_5,
    fontSize: rem(1),
    margin: rem(0.25)
  },
  tileIcon: {
    position: 'absolute',
    width: rem(0.75),
    height: rem(0.75),
    top: rem(0.75),
    right: rem(0.75)
  },
  nextButton: {
    backgroundColor: THEME.COLORS.SECONDARY,
    marginTop: rem(1),
    borderRadius: rem(1.5),
    width: '80%',
    height: rem(3),
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: rem(1.25)
  },
  sliderStyle: {
    marginTop: rem(2),
    width: rem(15),
    backgroundColor: THEME.COLORS.PRIMARY,
    borderRadius: rem(2)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
