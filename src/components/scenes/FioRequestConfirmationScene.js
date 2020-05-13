// @flow

import { bns } from 'biggystring'
import type { EdgeAccount, EdgeCurrencyWallet } from 'edge-core-js/src/types/types'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import { addToFioAddressCache } from '../../modules/FioAddress/util.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import T from '../../modules/UI/components/FormattedText/index'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import { styles as CryptoExchangeSceneStyle } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import { styles } from '../../styles/scenes/FioRequestConfirmationStyle'
import type { GuiCurrencyInfo } from '../../types/types'
import { FormFieldSelect } from '../common/FormFieldSelect'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError, showToast } from '../services/AirshipInstance'

export type FioRequestConfirmationProps = {
  exchangeSecondaryToPrimaryRatio: number,
  publicAddress: string,
  loading: boolean,
  chainCode: string,
  primaryCurrencyInfo: GuiCurrencyInfo,
  secondaryCurrencyInfo: GuiCurrencyInfo,
  fioWallets: EdgeCurrencyWallet[],
  account: EdgeAccount,
  isConnected: boolean
}

export type FioRequestConfirmationDispatchProps = {
  refreshReceiveAddressRequest: (walletId: string) => void,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type NavigationProps = {
  amounts: ExchangedFlipInputAmounts,
  fioModalData: {
    fioAddress: string,
    memo: string
  }
}

type Props = FioRequestConfirmationProps & FioRequestConfirmationDispatchProps & NavigationProps

type LocalState = {
  loading: boolean,
  selectedFioAddress: string,
  walletAddresses: { fioAddress: string, fioWallet: EdgeCurrencyWallet }[]
}

export class FioRequestConfirmationComponent extends Component<Props, LocalState> {
  constructor(props: Props) {
    super(props)
    this.state = {
      loading: false,
      selectedFioAddress: '',
      walletAddresses: []
    }
  }

  async componentDidMount() {
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
        selectedFioAddress: walletAddresses[0].fioAddress
      })
    }
  }

  onNextPress = async () => {
    const { walletAddresses, selectedFioAddress } = this.state
    const walletAddress = walletAddresses.find(({ fioAddress }) => fioAddress === selectedFioAddress)

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
          const getFeeRes = await fioWallet.otherMethods.fioAction('getFee', { endPoint: 'new_funds_request', fioAddress: this.state.selectedFioAddress })
          if (getFeeRes.fee) return showError(s.strings.fio_no_bundled_err_msg)
        } catch (e) {
          this.setState({ loading: false })
          return showError(s.strings.fio_get_fee_err_msg)
        }
        // send fio request
        await fioWallet.otherMethods.fioAction('requestFunds', {
          payerFioAddress: this.props.fioModalData.fioAddress,
          payeeFioAddress: this.state.selectedFioAddress,
          payeeTokenPublicAddress: this.props.publicAddress,
          amount: val,
          tokenCode: this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          chainCode: this.props.chainCode || this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          memo: this.props.fioModalData.memo,
          maxFee: 0
        })
        this.setState({ loading: false })
        showToast(s.strings.fio_request_ok_body)
        addToFioAddressCache(this.props.account, [this.props.fioModalData.fioAddress])
        Actions.popTo(Constants.TRANSACTION_LIST)
      } catch (error) {
        this.setState({ loading: false })
        showError(`${s.strings.fio_request_error_header}. ${error.json ? JSON.stringify(error.json.fields[0].error) : ''}`)
      }
    } else {
      showError(s.strings.fio_wallet_missing_for_fio_address)
    }
  }

  fiatAmount = (amount: string): string => {
    const fiatPerCrypto = this.props.exchangeSecondaryToPrimaryRatio
    return intl.formatNumber(fiatPerCrypto * parseFloat(amount), { toFixed: 2 }) || '0'
  }

  handleFioWalletChange = (something: string, index: number): void => {
    this.setState({ selectedFioAddress: this.state.walletAddresses[index].fioAddress })
  }

  labelFromItem = (item: { fioAddress: string }): string => {
    return item.fioAddress
  }

  render() {
    const { loading, selectedFioAddress, walletAddresses } = this.state
    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio } = this.props
    if (!primaryCurrencyInfo || !secondaryCurrencyInfo) return null
    let displayAmount, exchangeAmount
    try {
      displayAmount = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.displayDenomination.multiplier, 18)
      exchangeAmount = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
    } catch (e) {
      return null
    }
    const fiat = this.fiatAmount(exchangeAmount)
    const MaterialInputStyle = {
      ...MaterialInput,
      container: {
        ...MaterialInput.container,
        width: styles.input.width
      }
    }

    return (
      <SceneWrapper>
        <View style={styles.exchangeRateContainer}>
          <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeSecondaryToPrimaryRatio} />
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>
            {s.strings.fio_request_amount} {displayAmount} {primaryCurrencyInfo.displayDenomination.name} ({secondaryCurrencyInfo.displayDenomination.symbol}
            {fiat})
          </T>
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>{s.strings.fio_request_requesting_to}</T>
          <T style={styles.text}>{this.props.fioModalData.fioAddress}</T>
        </View>
        <View style={styles.selectContainer}>
          <FormFieldSelect
            style={MaterialInputStyle}
            onChangeText={this.handleFioWalletChange}
            label={`${s.strings.fio_request_requesting_from} ${s.strings.fio_address_confirm_screen_label}`}
            value={selectedFioAddress}
            labelExtractor={this.labelFromItem}
            valueExtractor={this.labelFromItem}
            data={walletAddresses}
          />
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>{s.strings.unique_identifier_memo}</T>
          <T style={styles.text}>{this.props.fioModalData.memo}</T>
        </View>
        <View style={styles.button}>
          <PrimaryButton onPress={this.onNextPress}>
            {loading ? <ActivityIndicator size="small" /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
        <View style={CryptoExchangeSceneStyle.shim} />
      </SceneWrapper>
    )
  }
}
