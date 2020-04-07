// @flow

import { bns } from 'biggystring'
import type { EdgeCurrencyWallet, EdgeDenomination, EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { WalletListModalConnected as WalletListModal } from '../../connectors/components/WalletListModalConnector.js'
import * as Constants from '../../constants/indexConstants'
import { intl } from '../../locales/intl'
import s from '../../locales/strings.js'
import type { ExchangeRatesState } from '../../modules/ExchangeRates/reducer'
import { PrimaryButton, TextAndIconButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import { MaterialInput } from '../../styles/components/FormFieldStyles.js'
import { styles as CryptoExchangeSceneStyle } from '../../styles/scenes/CryptoExchangeSceneStyles.js'
import { styles } from '../../styles/scenes/FioPendingRequestDetailsStyle.js'
import type { State } from '../../types/reduxTypes'
import type { GuiWallet } from '../../types/types'
import { FormField } from '../common/FormField'
import { SceneWrapper } from '../common/SceneWrapper'
import { Airship, showError } from '../services/AirshipInstance'

export type FioPendingRequestDetailsStateProps = {
  fromWallet: GuiWallet,
  toWallet: GuiWallet,

  // The following props are used to populate the confirmation modal
  fromCurrencyCode: string,
  toCurrencyCode: string,

  // Number of times To and From wallets were flipped
  wallets: { [string]: GuiWallet },
  supportedWalletTypes: Array<Object>,
  state: State,
  exchangeRates: ExchangeRatesState,

  fioWalletByAddress: EdgeCurrencyWallet | null,
  exchangeDenomination: EdgeDenomination,
  selectedFioPendingRequest: any,
  isoFiatCurrencyCode: any
}

export type FioPendingRequestDetailsDispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void,
  openModal(data: 'from' | 'to'): mixed,
  fioAcceptRequest: (
    fioWalletByAddress: EdgeCurrencyWallet,
    pendingRequest: Object,
    payerPublicAddress: string,
    txId: string,
    notes?: string,
    fee: number,
    cb: Function
  ) => any,
  createCurrencyWallet: (walletType: string, currencyCode: string) => void,
  setFioWalletByFioAddress: string => void
}

type Props = FioPendingRequestDetailsStateProps & FioPendingRequestDetailsDispatchProps

type LocalState = {
  memo: string
}

export class FioPendingRequestDetailsComponent extends Component<Props, LocalState> {
  constructor (props: Props) {
    super(props)
    const newState: LocalState = {
      memo: this.props.selectedFioPendingRequest.content.memo
    }
    this.state = newState
  }

  componentDidMount (): void {
    this.props.setFioWalletByFioAddress(this.props.selectedFioPendingRequest.payer_fio_address)
  }

  fiatAmount = (currencyCode: string, amount: string) => {
    const { exchangeRates, isoFiatCurrencyCode } = this.props
    let fiatPerCrypto
    if (currencyCode === Constants.FIO_STR) {
      fiatPerCrypto = 1
    } else {
      const rateKey = `${currencyCode}_${isoFiatCurrencyCode}`
      fiatPerCrypto = exchangeRates[rateKey] ? exchangeRates[rateKey] : 0
    }
    const amountToMultiply = parseFloat(amount)

    return (fiatPerCrypto * amountToMultiply).toFixed(2)
  }

  amountField = (amount: string, currencyCode: string, cryptoSymbol: string, currencySymbol: string) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>
          Amount: {amount} {cryptoSymbol} ({currencySymbol}
          {this.fiatAmount(currencyCode, amount)})
        </T>
      </View>
    )
  }

  requestedField = (payee: string) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>Request from</T>
        <T style={styles.value}>{payee}</T>
      </View>
    )
  }

  dateField = (date: Date) => {
    return (
      <View style={styles.row}>
        <T style={styles.title}>Date</T>
        <T style={styles.value}>{intl.formatExpDate(date, true)}</T>
      </View>
    )
  }

  launchFromWalletSelector = () => {
    this.props.openModal('from')
    this.renderDropUp()
  }

  sendCrypto = async () => {
    const { fioWalletByAddress, selectedFioPendingRequest: pendingRequest, exchangeDenomination } = this.props
    if (!fioWalletByAddress) return
    let nativeAmount = bns.mul(pendingRequest.content.amount, exchangeDenomination.multiplier)
    nativeAmount = bns.toFixed(nativeAmount, 0, 0)
    const guiMakeSpendInfo = {
      memo: this.state.memo,
      fioAddress: pendingRequest.payee_fio_address,
      currencyCode: pendingRequest.content.token_code,
      nativeAmount: nativeAmount,
      publicAddress: pendingRequest.content.payee_public_address,
      lockInputs: true,
      beforeTransaction: async () => {
        try {
          const getFeeResult = await fioWalletByAddress.otherMethods.fioAction('getFee', {
            endPoint: 'record_obt_data',
            fioAddress: pendingRequest.payer_fio_address
          })
          if (getFeeResult.fee) {
            showError(s.strings.fio_no_bundled_err_msg)
            throw new Error(s.strings.fio_no_bundled_err_msg)
          }
        } catch (e) {
          showError(s.strings.fio_get_fee_err_msg)
          throw e
        }
      },
      onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
        if (error) {
          setTimeout(() => {
            showError(s.strings.create_wallet_account_error_sending_transaction)
          }, 750)
        } else if (edgeTransaction) {
          let payerWalletAddress = ''
          if (edgeTransaction.otherParams) {
            if (edgeTransaction.otherParams.from && edgeTransaction.otherParams.from.length > 0) {
              payerWalletAddress = edgeTransaction.otherParams.from[0]
            }
          }
          this.props.fioAcceptRequest(
            fioWalletByAddress,
            pendingRequest,
            payerWalletAddress,
            edgeTransaction.txid,
            edgeTransaction.metadata ? edgeTransaction.metadata.notes : this.state.memo,
            0,
            () => {
              Actions.pop()
              Actions.pop()
              Actions.replace(Constants.TRANSACTION_DETAILS, { edgeTransaction: edgeTransaction })
            }
          )
        }
      }
    }

    Actions[Constants.SEND_CONFIRMATION]({ guiMakeSpendInfo })
  }

  renderButton = () => {
    if (this.props.fromCurrencyCode !== '') {
      return (
        <PrimaryButton onPress={() => this.sendCrypto()}>
          <PrimaryButton.Text>{s.strings.string_next_capitalized}</PrimaryButton.Text>
        </PrimaryButton>
      )
    }
    return null
  }

  renderDropUp = () => {
    const { onSelectWallet, toCurrencyCode, toWallet, wallets } = this.props
    let excludedCurrencyCode = '' // should allow for multiple excluded currencyCodes
    // some complex logic because 'toCurrencyCode/fromCurrencyCode'
    // can be denomination (needs to change to actual currencyCode)
    if (toWallet) {
      if (toWallet.enabledTokens.length > 1) {
        // could be token
        excludedCurrencyCode = toCurrencyCode
      } else {
        excludedCurrencyCode = toWallet.currencyCode
      }
    }
    const walletCurrencyCodes = []
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      if (wallet.currencyCode === 'ETH' && wallet.enabledTokens.length > 0) {
        walletCurrencyCodes.push(wallet.currencyCode)
        if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
          if (wallet.currencyCode === this.props.selectedFioPendingRequest.content.chain_code) {
            allowedWallets.push(wallets[id])
          }
        }
      }
      if (excludedCurrencyCode !== wallet.currencyCode) {
        walletCurrencyCodes.push(wallet.currencyCode)
        if (wallet.receiveAddress && wallet.receiveAddress.publicAddress) {
          if (wallet.currencyCode === this.props.selectedFioPendingRequest.content.chain_code) {
            allowedWallets.push(wallets[id])
          }
        }
      }
    }
    const supportedWalletTypes = []
    for (let i = 0; i < this.props.supportedWalletTypes.length; i++) {
      const swt = this.props.supportedWalletTypes[i]
      if (!walletCurrencyCodes.includes(swt.currencyCode) && swt.currencyCode !== 'EOS' && excludedCurrencyCode !== swt.currencyCode) {
        supportedWalletTypes.push(swt)
      }
    }

    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        wallets={allowedWallets}
        type={Constants.FROM}
        existingWalletToFilterId={toWallet.id}
        existingWalletToFilterCurrencyCode={toCurrencyCode}
        supportedWalletTypes={supportedWalletTypes}
        excludedCurrencyCode={[]}
        showWalletCreators={false}
        state={this.props.state}
        headerTitle={s.strings.fio_src_wallet}
        excludedTokens={[]}
        noWalletCodes={[]}
        disableZeroBalance={false}
      />
    )).then((response: any) => {
      if (response) {
        if (response.id) {
          onSelectWallet(response.id, response.currencyCode)
          return
        }
        this.props.createCurrencyWallet(response.value, response.currencyCode)
      }
    })
    return null
  }

  render () {
    const materialStyle = MaterialInput
    materialStyle.tintColor = 'white'
    materialStyle.baseColor = 'white'

    return (
      <SceneWrapper>
        <SafeAreaView>
          <View>
            {this.amountField(
              this.props.selectedFioPendingRequest.content.amount,
              this.props.selectedFioPendingRequest.content.token_code,
              this.props.selectedFioPendingRequest.content.token_code,
              '$'
            )}
          </View>
          <View>{this.requestedField(this.props.selectedFioPendingRequest.payee_fio_address)}</View>
          <View>{this.dateField(new Date(this.props.selectedFioPendingRequest.time_stamp))}</View>
          <View style={styles.memo}>
            <FormField
              style={materialStyle}
              label="Memo"
              onChangeText={text => this.setState({ memo: text })}
              value={this.state.memo}
              placeholder="Memo"
              multiline={true}
            />
          </View>
          <View style={styles.lineRow}>
            <View style={styles.line} />
          </View>
          <View style={CryptoExchangeSceneStyle.shim} />
          <View style={styles.buttonRow}>
            <TextAndIconButton
              style={{ ...CryptoExchangeSceneStyle.flipWrapper.walletSelector, container: styles.selectWalletBtn }}
              onPress={this.launchFromWalletSelector}
              icon={Constants.KEYBOARD_ARROW_DOWN}
              title={this.props.fromWallet.name || s.strings.fio_src_wallet}
            />
          </View>
          <View style={CryptoExchangeSceneStyle.shim} />
          <View style={styles.buttonRow}>{this.renderButton()}</View>
          <View style={CryptoExchangeSceneStyle.shim} />
        </SafeAreaView>
      </SceneWrapper>
    )
  }
}
