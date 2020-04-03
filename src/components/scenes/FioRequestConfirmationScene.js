// @flow

import { bns } from 'biggystring'
import type { EdgeAccount } from 'edge-core-js/src/types/types'
import React, { Component } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import * as Constants from '../../constants/indexConstants'
import { FIO_WALLET_TYPE } from '../../constants/WalletAndCurrencyConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import ExchangeRate from '../../modules/UI/components/ExchangeRate/index.js'
import type { ExchangedFlipInputAmounts } from '../../modules/UI/components/FlipInput/ExchangedFlipInput2'
import T from '../../modules/UI/components/FormattedText/index'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import { styles as CryptoExchangeSceneStyle } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import styles from '../../styles/scenes/FioRequestConfirmationStyle'
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
  amounts: ExchangedFlipInputAmounts,
  fioModalData: any,
  allWallets: any,
  account: EdgeAccount,
  isConnected: boolean
}

export type FioRequestConfirmationDispatchProps = {
  refreshReceiveAddressRequest: (walletId: string) => any,
  onSelectWallet: (walletId: string, currencyCode: string) => any
}

type Props = FioRequestConfirmationProps & FioRequestConfirmationDispatchProps

type LocalState = {
  loading: boolean
}

export class FioRequestConfirmationComponent extends Component<Props, LocalState> {
  fioWallets = []
  selectedWallet: string
  selectedWalletID: string
  selectedWalletFioAddress: string

  constructor (props: Props) {
    super(props)
    this.state = {
      loading: false
    }
  }

  async componentDidMount () {
    if (this.props.allWallets) {
      const allWalletsArr: any = Object.values(this.props.allWallets)
      try {
        for (const item of allWalletsArr) {
          if (item.type === FIO_WALLET_TYPE) {
            const engine = this.props.account.currencyWallets[item.id]
            const fioAddresses: string[] = await engine.otherMethods.getFioAddressNames()
            if (fioAddresses.length > 0) {
              for (const fioAddress of fioAddresses) {
                this.fioWallets.push({ wallet: item, engine: 'engine', name: fioAddress })
              }
            }
          }
        }
      } catch (error) {}
      this.selectedWallet = this.fioWallets[0].wallet.name + ': ' + this.fioWallets[0].name
      this.selectedWalletID = this.fioWallets[0].wallet.id
      this.selectedWalletFioAddress = this.fioWallets[0].name
    }
  }

  onNextPress = async () => {
    const engine = this.props.account.currencyWallets[this.selectedWalletID]

    if (engine) {
      const val = bns.div(this.props.amounts.nativeAmount, this.props.primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
      try {
        if (!this.props.isConnected) {
          showError(s.strings.fio_network_alert_text)
          return
        }
        this.setState({ loading: true })
        try {
          const getFeeRes = await engine.otherMethods.fioAction('getFee', { endPoint: 'new_funds_request', fioAddress: this.selectedWalletFioAddress })
          if (getFeeRes.fee) return showError(s.strings.fio_no_bundled_err_msg)
        } catch (e) {
          this.setState({ loading: false })
          return showError(s.strings.fio_get_fee_err_msg)
        }
        await engine.otherMethods.fioAction('requestFunds', {
          payerFioAddress: this.props.fioModalData.fioAddress,
          payeeFioAddress: this.selectedWalletFioAddress,
          payeeTokenPublicAddress: this.props.publicAddress,
          amount: val,
          tokenCode: this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          chainCode: this.props.chainCode || this.props.primaryCurrencyInfo.exchangeCurrencyCode,
          memo: this.props.fioModalData.memo,
          maxFee: 0
        })
        this.setState({ loading: false })
        showToast(s.strings.fio_reqiuest_ok_body)
        Actions.popTo(Constants.TRANSACTION_LIST)
      } catch (error) {
        this.setState({ loading: false })
        showError(`${s.strings.fio_reqiuest_error_header}. ${error.json ? JSON.stringify(error.json.fields[0].error) : ''}`)
      }
    }
  }

  fiatAmount = (amount: string) => {
    const fiatPerCrypto = this.props.exchangeSecondaryToPrimaryRatio
    return (fiatPerCrypto * parseFloat(amount)).toFixed(2)
  }

  handleFioWalletChange = (something: string, index: number, data: any) => {
    this.selectedWalletID = this.fioWallets[index].wallet.id
    this.selectedWalletFioAddress = this.fioWallets[index].name
  }

  labelFromWallet = (item: any) => {
    return item.wallet.name + ': ' + item.name
  }

  render () {
    const { loading } = this.state
    const { primaryCurrencyInfo, secondaryCurrencyInfo, exchangeSecondaryToPrimaryRatio } = this.props
    if (!primaryCurrencyInfo || !secondaryCurrencyInfo) return null
    let finalvalue, val
    try {
      finalvalue = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.displayDenomination.multiplier, 18)
      val = bns.div(this.props.amounts.nativeAmount, primaryCurrencyInfo.exchangeDenomination.multiplier, 18)
    } catch (e) {
      return null
    }
    const fiat = this.fiatAmount(val)
    const style = CryptoExchangeSceneStyle
    const materialStyle = MaterialInput
    materialStyle.tintColor = 'white'
    materialStyle.baseColor = 'white'
    const MaterialInputStyle = {
      ...MaterialInput,
      container: {
        ...MaterialInput.container,
        width: '70%'
      }
    }
    return (
      <SceneWrapper>
        <View style={styles.exchangeRateContainer}>
          <ExchangeRate primaryInfo={primaryCurrencyInfo} secondaryInfo={secondaryCurrencyInfo} secondaryDisplayAmount={exchangeSecondaryToPrimaryRatio} />
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>
            {s.strings.fio_request_amount} {finalvalue} {primaryCurrencyInfo.displayDenomination.name} ({secondaryCurrencyInfo.displayDenomination.symbol}
            {fiat})
          </T>
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>{s.strings.fio_request_requesting_from}</T>
          <T style={styles.text}>{this.props.fioModalData.fioAddress}</T>
        </View>
        <View style={styles.selectContainer}>
          <FormFieldSelect
            style={MaterialInputStyle}
            onChangeText={this.handleFioWalletChange}
            label={s.strings.select_wallet}
            value={this.selectedWallet}
            labelExtractor={this.labelFromWallet}
            valueExtractor={this.labelFromWallet}
            data={this.fioWallets}
          />
        </View>
        <View style={styles.textContainer}>
          <T style={styles.text}>{s.strings.unique_identifier_memo}</T>
          <T style={styles.text}>{this.props.fioModalData.memo}</T>
        </View>
        <View style={styles.button}>
          <PrimaryButton onPress={this.onNextPress}>
            {loading ? <ActivityIndicator size={'small'} /> : <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
        <View style={style.shim} />
      </SceneWrapper>
    )
  }
}
