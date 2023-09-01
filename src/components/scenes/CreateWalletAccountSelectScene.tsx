import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import {
  createAccountTransaction,
  createCurrencyWallet,
  fetchAccountActivationInfo,
  fetchWalletAccountActivationPaymentInfo
} from '../../actions/CreateWalletActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { THEME } from '../../theme/variables/airbitz'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { guessFromCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { scale } from '../../util/scaling'
import { logEvent } from '../../util/tracking'
import { fixFiatCurrencyCode } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { FormattedText as Text } from '../legacy/FormattedText/FormattedText.ui'
import { Airship, showError } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'

export interface AccountPaymentParams {
  requestedAccountName: string
  currencyCode: string
  ownerPublicKey: string
  activePublicKey: string
  requestedAccountCurrencyCode: string
}

interface Props extends EdgeSceneProps<'createWalletAccountSelect'> {}

export const CreateWalletAccountSelectScene = (props: Props) => {
  const { route } = props
  const { selectedFiat, selectedWalletType, accountName, existingWalletId } = route.params
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const supportedAssets = useSelector(state => state.ui.createWallet.handleActivationInfo.supportedAssets)
  const activationCost = useSelector(state => state.ui.createWallet.handleActivationInfo.activationCost)
  const paymentCurrencyCode = useSelector(state => state.ui.createWallet.walletAccountActivationPaymentInfo.currencyCode)
  const amount = useSelector(state => state.ui.createWallet.walletAccountActivationPaymentInfo.amount)
  const existingCoreWallet = existingWalletId ? currencyWallets[existingWalletId] : undefined
  const paymentDenominationSymbol = useSelector(state =>
    paymentCurrencyCode != null && existingCoreWallet != null
      ? getExchangeDenomination(state, existingCoreWallet.currencyInfo.pluginId, paymentCurrencyCode).symbol ?? ''
      : ''
  )
  const walletAccountActivationQuoteError = useSelector(state => state.ui.createWallet.walletAccountActivationQuoteError)

  const [isCreatingWallet, setIsCreatingWallet] = React.useState(true)
  const [walletId, setWalletId] = React.useState('')

  const instructionSyntax = sprintf(
    lstrings.create_wallet_account_select_instructions_with_cost_4s,
    selectedWalletType.currencyCode,
    selectedWalletType.currencyCode,
    config.appNameShort,
    `${activationCost} ${selectedWalletType.currencyCode}`
  )
  const confirmMessageSyntax = sprintf(lstrings.create_wallet_account_make_payment, selectedWalletType.currencyCode)

  const { tokenId } = guessFromCurrencyCode(account, { currencyCode: selectedWalletType.currencyCode })

  const renameAndReturnWallet = useHandler(async (wallet: EdgeCurrencyWallet) => {
    await wallet.renameWallet(accountName)
    setIsCreatingWallet(false)
    return wallet
  })

  let createdWallet: Promise<EdgeCurrencyWallet>
  if (existingCoreWallet != null) {
    createdWallet = renameAndReturnWallet(existingCoreWallet)
  } else {
    createdWallet = dispatch(createCurrencyWallet(accountName, selectedWalletType.walletType, fixFiatCurrencyCode(selectedFiat.value))).then(wallet => {
      setIsCreatingWallet(false)
      return wallet
    })
  }

  const onPressSelect = useHandler(() => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={props.navigation} headerTitle={lstrings.select_wallet} allowedAssets={supportedAssets} />
    ))
      .then(async ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          await onSelectWallet(walletId, currencyCode)
        }
      })
      .catch(err => showError(err))
  })

  const onPressSubmit = useHandler(async () => {
    const createdWalletInstance = await createdWallet
    dispatch(createAccountTransaction(props.navigation, createdWalletInstance.id, accountName, walletId)).catch(err => showError(err))
  })

  const onSelectWallet = useHandler(async (walletId: string, paymentCurrencyCode: string) => {
    dispatch({ type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR', data: '' })
    setWalletId(walletId)
    const createdWalletInstance = await createdWallet
    const paymentInfo: AccountPaymentParams = {
      requestedAccountName: accountName,
      currencyCode: paymentCurrencyCode,
      ownerPublicKey: createdWalletInstance.publicWalletInfo.keys.ownerPublicKey,
      activePublicKey: createdWalletInstance.publicWalletInfo.keys.publicKey,
      requestedAccountCurrencyCode: selectedWalletType.currencyCode
    }
    dispatch(fetchWalletAccountActivationPaymentInfo(paymentInfo, createdWalletInstance))
  })

  React.useEffect(() => {
    logEvent('Activate_Wallet_Select')
    dispatch(fetchAccountActivationInfo(selectedWalletType.walletType)).catch(err => showError(err))
  }, [selectedWalletType.walletType, dispatch])

  const renderSelectWallet = () => {
    const currencyCode = selectedWalletType.currencyCode
    const isSelectWalletDisabled = !activationCost || activationCost === ''
    return (
      <View style={styles.selectPaymentLower}>
        <View style={styles.buttons}>
          <PrimaryButton disabled={isSelectWalletDisabled} style={styles.next} onPress={onPressSelect}>
            {isSelectWalletDisabled ? (
              <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
            ) : (
              <PrimaryButton.Text>{lstrings.create_wallet_account_select_wallet}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
        <View style={styles.paymentArea}>
          <Text style={styles.paymentLeft}>{lstrings.create_wallet_account_amount_due}</Text>
          <Text style={styles.paymentRight}>
            {activationCost} {currencyCode}
          </Text>
        </View>
      </View>
    )
  }

  const renderPaymentReview = () => {
    const wallet = account.currencyWallets[walletId]
    if (!wallet) return null
    const name = getWalletName(wallet)

    const isContinueButtonDisabled = isCreatingWallet

    return (
      <View>
        <View style={styles.selectPaymentLower}>
          <View style={styles.accountReviewWalletNameArea}>
            <Text style={styles.accountReviewWalletNameText}>
              {name}:{paymentCurrencyCode}
            </Text>
          </View>
          <View style={styles.paymentAndIconArea}>
            <View style={styles.paymentLeftIconWrap}>
              <CryptoIcon pluginId={wallet.currencyInfo.pluginId} sizeRem={1.5} />
            </View>
            <View style={styles.paymentArea}>
              <Text style={styles.paymentLeft}>
                {paymentDenominationSymbol} {amount} {paymentCurrencyCode}
              </Text>
              <Text style={styles.paymentRight}>
                {activationCost} {selectedWalletType.currencyCode}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.accountReviewInfoArea}>
          <Text style={styles.accountReviewInfoText}>
            {lstrings.create_wallet_crypto_type_label} {selectedWalletType.currencyCode}
          </Text>
          <Text style={styles.accountReviewInfoText}>
            {lstrings.create_wallet_fiat_type_label} {selectedFiat.label}
          </Text>
          <Text style={styles.accountReviewInfoText}>
            {lstrings.create_wallet_name_label} {accountName}
          </Text>
        </View>
        <View style={styles.accountReviewConfirmArea}>
          <Text style={styles.accountReviewConfirmText}>{lstrings.create_wallet_account_confirm}</Text>
        </View>
        <View style={styles.confirmButtonArea}>
          <PrimaryButton disabled={isContinueButtonDisabled} style={styles.confirmButton} onPress={onPressSubmit}>
            {/* we want it disabled with activity indicator if creating wallet, or wallet is created and pending quote */}
            {isContinueButtonDisabled ? (
              <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
            ) : (
              <PrimaryButton.Text>{lstrings.legacy_address_modal_continue}</PrimaryButton.Text>
            )}
          </PrimaryButton>
        </View>
      </View>
    )
  }

  return (
    <SceneWrapper>
      <View style={styles.scene}>
        <ScrollView>
          <View style={styles.scrollableView}>
            <CryptoIcon marginRem={[1.5, 0, 0, 0]} sizeRem={4} tokenId={tokenId} />
            <View style={styles.createWalletPromptArea}>
              <Text style={styles.instructionalText}>{!walletId || walletAccountActivationQuoteError ? instructionSyntax : confirmMessageSyntax}</Text>
            </View>
            {!walletId || walletAccountActivationQuoteError ? renderSelectWallet() : renderPaymentReview()}
          </View>
          <View style={{ paddingBottom: 200 }} />
        </ScrollView>
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.WHITE
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
  paymentAndIconArea: {
    flexDirection: 'row'
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
  paymentLeftIconWrap: {
    paddingVertical: scale(12),
    marginRight: 6
  },

  paymentRight: {
    fontFamily: THEME.FONTS.BOLD,
    fontSize: scale(16),
    color: THEME.COLORS.GRAY_2
  },
  accountReviewWalletNameArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: scale(14),
    paddingBottom: scale(8),
    alignItems: 'center'
  },
  accountReviewWalletNameText: {
    fontFamily: THEME.FONTS.BOLD,
    fontSize: scale(16),
    color: THEME.COLORS.SECONDARY
  },
  accountReviewInfoArea: {
    width: '100%',
    marginVertical: scale(10),
    paddingHorizontal: scale(10)
  },
  accountReviewInfoText: {
    color: THEME.COLORS.GRAY_2
  },
  accountReviewConfirmArea: {
    width: '100%',
    marginTop: scale(12),
    marginBottom: scale(12),
    paddingHorizontal: scale(10)
  },
  accountReviewConfirmText: {
    color: THEME.COLORS.GRAY_2,
    textAlign: 'center'
  },
  confirmButtonArea: {
    marginHorizontal: scale(30)
  },
  confirmButton: {}
}))
