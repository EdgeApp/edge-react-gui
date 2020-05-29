// @flow

import { type EdgeCurrencyWallet, type EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { styles as fioAddressStyles } from '../../styles/scenes/FioAddressRegisterStyle'
import type { FioDomain, GuiWallet } from '../../types/types'
import { Airship, showError } from '../services/AirshipInstance'

export type StateProps = {
  supportedCurrencies: { [currencyCode: string]: boolean },
  paymentInfo: { [currencyCode: string]: { amount: string, address: string, nativeAmount: string } },
  activationCost: number,
  wallets: { [string]: GuiWallet },
  fioAddress: string,
  fioWallets: EdgeCurrencyWallet[],
  defaultFiatCode: string,
  loading: boolean,
  isConnected: boolean
}

export type NavigationProps = {
  selectedWallet: EdgeCurrencyWallet,
  selectedDomain: FioDomain
}

export type DispatchProps = {
  getRegInfo: (fioAddress: string, selectedWallet: EdgeCurrencyWallet, selectedDomain: FioDomain) => Promise<void>,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type Props = NavigationProps & StateProps & DispatchProps

export class FioAddressRegisterSelectWalletScene extends Component<Props> {
  componentDidMount(): void {
    const { fioAddress, selectedWallet, selectedDomain } = this.props
    this.props.getRegInfo(fioAddress, selectedWallet, selectedDomain)
  }

  onPressNext = async () => {
    const { selectedDomain, supportedCurrencies } = this.props

    if (selectedDomain.name !== Constants.FIO_DOMAIN_DEFAULT.name) {
      return this.onSelectWallet(selectedDomain.walletId, Constants.FIO_STR)
    }

    const allowedCurrencyCodes = []
    for (const currency in supportedCurrencies) {
      if (supportedCurrencies[currency]) {
        allowedCurrencyCodes.push(currency)
      }
    }
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />).then(
      (response: WalletListResult) => {
        if (response.walletToSelect) {
          this.onSelectWallet(response.walletToSelect.walletId, response.walletToSelect.currencyCode)
        }
      }
    )
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const { activationCost, isConnected, paymentInfo: allPaymentInfo, selectedWallet } = this.props

    if (isConnected) {
      if (paymentCurrencyCode === Constants.FIO_STR) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        Actions[Constants.FIO_ADDRESS_CONFIRM]({ paymentWallet, fee: activationCost, ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey })
      } else {
        this.props.onSelectWallet(walletId, paymentCurrencyCode)
        const guiMakeSpendInfo = {
          currencyCode: paymentCurrencyCode,
          nativeAmount: allPaymentInfo[paymentCurrencyCode].nativeAmount,
          publicAddress: allPaymentInfo[paymentCurrencyCode].address,
          dismissAlert: true,
          lockInputs: true,
          onDone: (error: Error | null, edgeTransaction?: EdgeTransaction) => {
            if (error) {
              setTimeout(() => {
                showError(s.strings.create_wallet_account_error_sending_transaction)
              }, 750)
            } else if (edgeTransaction) {
              Alert.alert(
                `${s.strings.fio_address_register_form_field_label} ${s.strings.fragment_wallet_unconfirmed}`,
                s.strings.fio_address_register_pending,
                [{ text: s.strings.string_ok_cap }]
              )
              Actions[Constants.WALLET_LIST]()
            }
          }
        }

        Actions[Constants.SEND_CONFIRMATION]({ guiMakeSpendInfo })
      }
    } else {
      showError(s.strings.fio_network_alert_text)
    }
  }

  renderSelectWallet = () => {
    const { activationCost, selectedDomain, loading } = this.props
    const isSelectWalletDisabled = !activationCost || activationCost === 0
    const isDefaultDomainSelected = selectedDomain.name === Constants.FIO_DOMAIN_DEFAULT.name

    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={styles.next} onPress={this.onPressNext}>
            {isSelectWalletDisabled || loading ? (
              <ActivityIndicator />
            ) : (
              <PrimaryButton.Text>
                {isDefaultDomainSelected ? s.strings.create_wallet_account_select_wallet : s.strings.string_next_capitalized}
              </PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
        <View style={styles.paymentArea}>
          <T style={styles.paymentLeft}>{s.strings.create_wallet_account_amount_due}</T>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <T style={styles.paymentRight}>
              {activationCost} {Constants.FIO_STR}
            </T>
          )}
        </View>
      </View>
    )
  }

  render() {
    const { activationCost, loading } = this.props
    const detailsText = sprintf(s.strings.fio_address_wallet_selection_text, loading ? '-' : activationCost)
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.scrollableGradient} />
          <ScrollView>
            <View style={styles.scrollableView}>
              <Image source={fioAddressIcon} style={fioAddressStyles.image} resizeMode="cover" />
              <View style={styles.createWalletPromptArea}>
                <T style={styles.instructionalText}>{detailsText}</T>
              </View>
              {this.renderSelectWallet()}
              <View style={fioAddressStyles.bottomSpace} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    )
  }
}
