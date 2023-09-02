import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { createAccountTransaction, fetchAccountActivationInfo, fetchWalletAccountActivationPaymentInfo } from '../../actions/CreateWalletActions'
import { CryptoIcon } from '../../components/icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomination } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { guessFromCurrencyCode } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { Card } from '../cards/Card'
import { SceneWrapper } from '../common/SceneWrapper'
import { IconDataRow } from '../data/row/IconDataRow'
import { Airship, showError } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

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
  const { selectedWalletType, accountName, existingWalletId } = route.params
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const supportedAssets = useSelector(state => state.ui.createWallet.handleActivationInfo.supportedAssets)
  const activationCost = useSelector(state => state.ui.createWallet.handleActivationInfo.activationCost)
  const paymentCurrencyCode = useSelector(state => state.ui.createWallet.walletAccountActivationPaymentInfo.currencyCode)
  const amount = useSelector(state => state.ui.createWallet.walletAccountActivationPaymentInfo.amount)
  const existingCoreWallet = currencyWallets[existingWalletId]
  const paymentDenominationSymbol = useSelector(state =>
    paymentCurrencyCode != null && existingCoreWallet != null
      ? getExchangeDenomination(state, existingCoreWallet.currencyInfo.pluginId, paymentCurrencyCode).symbol ?? ''
      : ''
  )
  const walletAccountActivationQuoteError = useSelector(state => state.ui.createWallet.walletAccountActivationQuoteError)

  const instructionSyntax = sprintf(
    lstrings.create_wallet_account_select_instructions_with_cost_4s,
    selectedWalletType.currencyCode,
    selectedWalletType.currencyCode,
    config.appNameShort,
    `${activationCost} ${selectedWalletType.currencyCode}`
  )
  const confirmMessageSyntax = sprintf(lstrings.create_wallet_account_make_payment_2s, selectedWalletType.currencyCode, existingCoreWallet.name)
  const { tokenId } = guessFromCurrencyCode(account, { currencyCode: selectedWalletType.currencyCode })

  const [isCreatingWallet, setIsCreatingWallet] = React.useState(true)
  const [walletId, setWalletId] = React.useState('')

  const paymentWallet = account.currencyWallets[walletId]
  const isRenderSelect = walletId === '' || walletAccountActivationQuoteError

  const handleRenameAndReturnWallet = useHandler(async () => {
    await existingCoreWallet.renameWallet(accountName)
    setIsCreatingWallet(false)
    return existingCoreWallet
  })

  const handleSelect = useHandler(() => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={props.navigation} headerTitle={lstrings.select_wallet} allowedAssets={supportedAssets} />
    ))
      .then(async ({ walletId, currencyCode }: WalletListResult) => {
        if (walletId && currencyCode) {
          dispatch({ type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR', data: '' })
          setWalletId(walletId)
          const createdWalletInstance = await handleRenameAndReturnWallet()
          const paymentInfo: AccountPaymentParams = {
            requestedAccountName: accountName,
            currencyCode,
            ownerPublicKey: createdWalletInstance.publicWalletInfo.keys.ownerPublicKey,
            activePublicKey: createdWalletInstance.publicWalletInfo.keys.publicKey,
            requestedAccountCurrencyCode: selectedWalletType.currencyCode
          }
          dispatch(fetchWalletAccountActivationPaymentInfo(paymentInfo, createdWalletInstance))
        }
      })
      .catch(err => showError(err))
  })

  const handleSubmit = useHandler(async () => {
    const createdWalletInstance = await handleRenameAndReturnWallet()
    dispatch(createAccountTransaction(props.navigation, createdWalletInstance.id, accountName, walletId)).catch(err => showError(err))
  })

  const handleCancel = useHandler(() => setWalletId(''))

  React.useEffect(() => {
    logEvent('Activate_Wallet_Select')
    dispatch(fetchAccountActivationInfo(selectedWalletType.walletType)).catch(err => showError(err))
  }, [selectedWalletType.walletType, dispatch])

  return (
    <SceneWrapper>
      <View style={styles.titleIconArea}>
        <CryptoIcon sizeRem={4} pluginId={existingCoreWallet.currencyInfo.pluginId} tokenId={tokenId} />
      </View>
      <View style={styles.createWalletPromptArea}>
        <EdgeText numberOfLines={10}>{isRenderSelect ? instructionSyntax : confirmMessageSyntax}</EdgeText>
      </View>

      <View style={styles.selectPaymentLower}>
        {isRenderSelect ? (
          <Card>
            <View style={styles.paymentCostArea}>
              <EdgeText>{lstrings.create_wallet_account_amount_due}</EdgeText>
              <EdgeText style={styles.paymentRight}>
                {activationCost} {selectedWalletType.currencyCode}
              </EdgeText>
            </View>
          </Card>
        ) : (
          <IconDataRow
            icon={<CryptoIcon pluginId={paymentWallet.currencyInfo.pluginId} sizeRem={2} />}
            leftText={getWalletName(paymentWallet)}
            leftSubtext={`${lstrings.send_confirmation_balance}: ${paymentWallet.balances[paymentCurrencyCode]} ${paymentCurrencyCode}`}
            rightText={`${paymentDenominationSymbol} ${amount} ${paymentCurrencyCode}`}
            rightSubText={`≈ ${activationCost} ${selectedWalletType.currencyCode}`}
          />
        )}
      </View>
      <View style={styles.buttonArea}>
        {isRenderSelect ? (
          <ButtonsContainer
            primary={{ disabled: !activationCost || activationCost === '', onPress: handleSelect, label: lstrings.create_wallet_account_select_wallet }}
            layout="column"
          />
        ) : (
          <>
            <EdgeText style={styles.accountReviewConfirmText} numberOfLines={2}>
              {lstrings.create_wallet_account_confirm}
            </EdgeText>
            <ButtonsContainer
              primary={{ disabled: isCreatingWallet, onPress: handleSubmit, label: lstrings.legacy_address_modal_continue }}
              secondary={{ disabled: isCreatingWallet, onPress: handleCancel, label: lstrings.string_cancel_cap }}
              layout="column"
            />
          </>
        )}
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  createWalletPromptArea: {
    paddingTop: theme.rem(1),
    paddingBottom: theme.rem(0.5),
    paddingHorizontal: theme.rem(1.25)
  },
  selectPaymentLower: {
    marginTop: theme.rem(3),
    marginVertical: theme.rem(0.5),
    paddingHorizontal: theme.rem(1),
    flex: 1,
    justifyContent: 'space-between'
  },
  paymentCostArea: {
    flexDirection: 'row',
    paddingVertical: theme.rem(0.5),
    justifyContent: 'space-between'
  },
  paymentRight: {
    fontFamily: theme.fontFaceBold
  },
  accountReviewConfirmText: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.75),
    textAlign: 'center'
  },
  buttonArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginHorizontal: theme.rem(0.5),
    flex: 1
  },
  titleIconArea: {
    marginVertical: theme.rem(2),
    flexDirection: 'row',
    justifyContent: 'center'
  }
}))
