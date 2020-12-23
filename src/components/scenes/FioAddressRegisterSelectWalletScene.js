// @flow

import { bns } from 'biggystring'
import { type EdgeCurrencyConfig, type EdgeCurrencyWallet, type EdgeDenomination, type EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import { sprintf } from 'sprintf-js'

import fioAddressIcon from '../../assets/images/list_fioAddress.png'
import { type WalletListResult, WalletListModal } from '../../components/modals/WalletListModal.js'
import * as Constants from '../../constants/indexConstants'
import s from '../../locales/strings.js'
import { getRegInfo } from '../../modules/FioAddress/util'
import { getExchangeDenomination } from '../../modules/Settings/selectors'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/SafeAreaView.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { type RootState } from '../../types/reduxTypes'
import type { FioDomain, GuiWallet } from '../../types/types'
import { scale } from '../../util/scaling.js'
import { Airship, showError } from '../services/AirshipInstance'

export type StateProps = {
  state: RootState,
  wallets: { [string]: GuiWallet },
  fioPlugin: EdgeCurrencyConfig,
  fioWallets: EdgeCurrencyWallet[],
  fioDisplayDenomination: EdgeDenomination,
  defaultFiatCode: string,
  isConnected: boolean
}

type NavigationProps = {
  fioAddress: string,
  selectedWallet: EdgeCurrencyWallet,
  selectedDomain: FioDomain,
  isFallback?: boolean
}

export type DispatchProps = {
  onSelectWallet: (walletId: string, currencyCode: string) => void
}

type LocalState = {
  loading: boolean,
  supportedCurrencies: { [currencyCode: string]: boolean },
  paymentInfo: { [currencyCode: string]: { amount: string, address: string } },
  activationCost: number
}

type Props = NavigationProps & StateProps & DispatchProps

export class FioAddressRegisterSelectWalletScene extends React.Component<Props, LocalState> {
  state: LocalState = {
    loading: false,
    activationCost: 40,
    supportedCurrencies: {},
    paymentInfo: {}
  }

  componentDidMount(): void {
    this.getRegInfo()
  }

  getRegInfo = async () => {
    this.setState({ loading: true })

    try {
      const { activationCost, supportedCurrencies, paymentInfo } = await getRegInfo(
        this.props.fioPlugin,
        this.props.fioAddress,
        this.props.selectedWallet,
        this.props.selectedDomain,
        this.props.fioDisplayDenomination,
        this.props.isFallback
      )
      this.setState({ activationCost, supportedCurrencies, paymentInfo })
    } catch (e) {
      showError(e)
    }

    this.setState({ loading: false })
  }

  onPressNext = async () => {
    const { selectedDomain } = this.props
    const { supportedCurrencies } = this.state

    if (selectedDomain.walletId) {
      return this.onSelectWallet(selectedDomain.walletId, Constants.FIO_STR)
    }

    const allowedCurrencyCodes = []
    for (const currency of Object.keys(supportedCurrencies)) {
      if (supportedCurrencies[currency]) {
        allowedCurrencyCodes.push(currency)
      }
    }
    Airship.show(bridge => <WalletListModal bridge={bridge} headerTitle={s.strings.select_wallet} allowedCurrencyCodes={allowedCurrencyCodes} />).then(
      ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          this.onSelectWallet(walletId, currencyCode)
        }
      }
    )
  }

  onSelectWallet = async (walletId: string, paymentCurrencyCode: string) => {
    const { isConnected, selectedWallet, fioAddress, state } = this.props
    const { activationCost, paymentInfo: allPaymentInfo } = this.state

    if (isConnected) {
      if (paymentCurrencyCode === Constants.FIO_STR) {
        const { fioWallets } = this.props
        const paymentWallet = fioWallets.find(fioWallet => fioWallet.id === walletId)
        Actions[Constants.FIO_NAME_CONFIRM]({
          fioName: fioAddress,
          paymentWallet,
          fee: activationCost,
          ownerPublicKey: selectedWallet.publicWalletInfo.keys.publicKey
        })
      } else {
        this.props.onSelectWallet(walletId, paymentCurrencyCode)

        const exchangeDenomination = getExchangeDenomination(state, paymentCurrencyCode)
        let nativeAmount = bns.mul(allPaymentInfo[paymentCurrencyCode].amount, exchangeDenomination.multiplier)
        nativeAmount = bns.toFixed(nativeAmount, 0, 0)

        const guiMakeSpendInfo = {
          currencyCode: paymentCurrencyCode,
          nativeAmount,
          publicAddress: allPaymentInfo[paymentCurrencyCode].address,
          metadata: {
            name: s.strings.fio_address_register_metadata_name,
            notes: `${s.strings.title_fio_address_confirmation}\n${fioAddress}`
          },
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
                sprintf(s.strings.fio_address_register_pending, s.strings.fio_address_register_form_field_label),
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
    const { selectedDomain } = this.props
    const { activationCost, loading } = this.state
    const isSelectWalletDisabled = !activationCost || activationCost === 0

    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={styles.next} onPress={this.onPressNext}>
            {isSelectWalletDisabled || loading ? (
              <ActivityIndicator />
            ) : (
              <PrimaryButton.Text>
                {!selectedDomain.walletId ? s.strings.create_wallet_account_select_wallet : s.strings.string_next_capitalized}
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
    const { activationCost, loading } = this.state
    const detailsText = sprintf(s.strings.fio_address_wallet_selection_text, loading ? '-' : activationCost)
    return (
      <SafeAreaView>
        <View style={styles.scene}>
          <Gradient style={styles.scrollableGradient} />
          <ScrollView>
            <View style={styles.scrollableView}>
              <Image source={fioAddressIcon} style={styles.image} resizeMode="cover" />
              <View style={styles.createWalletPromptArea}>
                <T style={styles.instructionalText}>{detailsText}</T>
              </View>
              {this.renderSelectWallet()}
              <View style={styles.bottomSpace} />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    )
  }
}

const rawStyles = {
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
  },
  scrollableGradient: {
    height: THEME.HEADER
  },
  scrollableView: {
    position: 'relative',
    paddingHorizontal: 20
  },
  createWalletPromptArea: {
    paddingTop: scale(16),
    paddingBottom: scale(8)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center',
    color: THEME.COLORS.GRAY_1
  },
  text: {
    color: THEME.COLORS.WHITE
  },
  buttons: {
    marginTop: scale(24),
    flexDirection: 'row'
  },
  next: {
    marginLeft: scale(1),
    flex: 1
  },
  selectPaymentLower: {
    backgroundColor: THEME.COLORS.GRAY_4,
    width: '100%',
    marginVertical: scale(8),
    paddingHorizontal: scale(16)
  },
  paymentArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: scale(12),
    flex: 1
  },
  paymentLeft: {
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2
  },
  paymentRight: {
    fontFamily: THEME.FONTS.BOLD,
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2
  },
  image: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(50),
    width: scale(55)
  },
  title: {
    paddingTop: scale(24)
  },
  paddings: {
    paddingVertical: scale(8)
  },
  inputContainer: {
    width: 'auto',
    marginTop: 0,
    marginBottom: 0
  },
  statusIconError: {
    color: THEME.COLORS.ACCENT_RED
  },
  statusIconOk: {
    color: THEME.COLORS.ACCENT_MINT
  },
  formFieldView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(14),
    marginBottom: scale(12)
  },
  formFieldViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: PLATFORM.deviceWidth - scale(30) - scale(40)
  },
  statusIconContainer: {
    width: scale(25),
    height: scale(25)
  },
  statusIcon: {
    alignSelf: 'flex-end',
    marginTop: scale(29),
    width: scale(25),
    height: scale(25)
  },
  bottomSpace: {
    paddingBottom: scale(500)
  },
  selectWalletBlock: {
    marginTop: scale(48),
    paddingHorizontal: scale(18),
    paddingBottom: scale(10),
    backgroundColor: THEME.COLORS.GRAY_3
  },
  selectWalletBtn: {
    marginTop: scale(15),
    paddingVertical: scale(10),
    paddingHorizontal: scale(5),
    backgroundColor: THEME.COLORS.BLUE_3
  },
  domain: {
    marginTop: scale(24),
    marginLeft: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(5),
    borderColor: THEME.COLORS.BLUE_3,
    borderWidth: scale(2)
  },
  domainText: {
    color: THEME.COLORS.BLUE_3,
    fontSize: scale(16)
  },
  domainListRowName: {
    flex: 1,
    fontSize: THEME.rem(1),
    color: THEME.COLORS.SECONDARY
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: THEME.rem(0.75),
    paddingRight: THEME.rem(0.75),
    paddingVertical: THEME.rem(0.75)
  }
}
export const styles: typeof rawStyles = StyleSheet.create(rawStyles)
