// @flow

import { type EdgeCurrencyWallet, type EdgeTransaction } from 'edge-core-js'
import React, { Component } from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import { WalletListModalConnected as WalletListModal } from '../../connectors/components/WalletListModalConnector'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import T from '../../modules/UI/components/FormattedText/index'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/CreateWalletStyle.js'
import { styles as fioAddressStyles } from '../../styles/scenes/FioAddressRegisterStyle'
import type { GuiWallet } from '../../types/types'
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
  selectedWallet: { wallet: EdgeCurrencyWallet }
}

export type DispatchProps = {
  getRegInfo: (fioAddress: string, selectedWallet: EdgeCurrencyWallet) => Promise<void>,
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type Props = NavigationProps & StateProps & DispatchProps

export class FioAddressRegisterSelectWalletScene extends Component<Props> {
  componentDidMount (): void {
    const {
      fioAddress,
      selectedWallet: { wallet }
    } = this.props
    this.props.getRegInfo(fioAddress, wallet)
  }

  onPressSelect = async () => {
    const { supportedCurrencies, wallets } = this.props
    const allowedWallets = []
    for (const id in wallets) {
      const wallet = wallets[id]
      if (supportedCurrencies[wallet.currencyCode]) {
        allowedWallets.push(wallets[id])
      }
    }
    Airship.show(bridge => (
      <WalletListModal
        bridge={bridge}
        wallets={allowedWallets}
        existingWalletToFilterId={''}
        existingWalletToFilterCurrencyCode={''}
        supportedWalletTypes={[]}
        excludedCurrencyCode={[]}
        showWalletCreators={false}
        headerTitle={s.strings.select_wallet}
        excludedTokens={[]}
        noWalletCodes={[]}
        disableZeroBalance={false}
      />
    )).then((response: GuiWallet | Object | null) => {
      if (response) {
        this.onSelectWallet(response.id, response.currencyCode)
      }
    })
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const {
      activationCost,
      isConnected,
      paymentInfo: allPaymentInfo,
      selectedWallet: { wallet }
    } = this.props

    if (isConnected) {
      if (paymentCurrencyCode === Constants.FIO_STR) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        Actions[Constants.FIO_ADDRESS_CONFIRM]({ paymentWallet, fee: activationCost, ownerPublicKey: wallet.publicWalletInfo.keys.publicKey })
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
              Alert.alert(`${s.strings.fio_address_label} ${s.strings.fragment_wallet_unconfirmed}`, s.strings.fio_address_register_pending, [
                { text: s.strings.string_ok_cap }
              ])
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
    const { activationCost, loading } = this.props
    const isSelectWalletDisabled = !activationCost || activationCost === 0
    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={[styles.next]} onPress={this.onPressSelect}>
            {isSelectWalletDisabled || loading ? (
              <ActivityIndicator />
            ) : (
              <PrimaryButton.Text>{s.strings.create_wallet_account_select_wallet}</PrimaryButton.Text>
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

  render () {
    const { activationCost, loading } = this.props
    const detailsText = sprintf(s.strings.fio_address_wallet_selection_text, loading ? '-' : activationCost)
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.scrollableGradient} />
          <ScrollView>
            <View style={styles.scrollableView}>
              <Image source={fioAddressIcon} style={fioAddressStyles.image} resizeMode={'cover'} />
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
