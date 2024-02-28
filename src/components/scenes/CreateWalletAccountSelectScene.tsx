import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { createAccountTransaction, fetchAccountActivationInfo, fetchWalletAccountActivationPaymentInfo } from '../../actions/CreateWalletActions'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getWalletTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { SceneWrapper } from '../common/SceneWrapper'
import { IconDataRow } from '../data/row/IconDataRow'
import { withWallet } from '../hoc/withWallet'
import { Airship, showError } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'
import { CardUi4 } from '../ui4/CardUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'

export interface CreateWalletAccountSelectParams {
  accountName: string
  walletId: string
}

export interface ActivationPaymentInfo {
  requestedAccountName: string
  currencyCode: string
  ownerPublicKey: string
  activePublicKey: string
  requestedAccountCurrencyCode: string
}

interface Props extends EdgeSceneProps<'createWalletAccountSelect'> {
  wallet: EdgeCurrencyWallet
}

export const CreateWalletAccountSelectScene = withWallet((props: Props) => {
  const { route, wallet: existingWallet } = props
  const { accountName } = route.params
  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)
  const { currencyCode: existingCurrencyCode, pluginId: existingPluginId } = existingWallet.currencyInfo

  const account = useSelector(state => state.core.account)
  const supportedAssets = useSelector(state => state.ui.createWallet.handleActivationInfo.supportedAssets)
  const activationCost = useSelector(state => state.ui.createWallet.handleActivationInfo.activationCost)
  const paymentCurrencyCode = useSelector(state => state.ui.createWallet.walletAccountActivationPaymentInfo.currencyCode)
  const amount = useSelector(state => state.ui.createWallet.walletAccountActivationPaymentInfo.amount)
  const paymentDenominationSymbol =
    paymentCurrencyCode == null ? '' : getExchangeDenomByCurrencyCode(existingWallet.currencyConfig, paymentCurrencyCode).symbol ?? ''

  const walletAccountActivationQuoteError = useSelector(state => state.ui.createWallet.walletAccountActivationQuoteError)

  const instructionSyntax = sprintf(
    lstrings.create_wallet_account_select_instructions_with_cost_4s,
    existingCurrencyCode,
    existingCurrencyCode,
    config.appNameShort,
    `${activationCost} ${existingCurrencyCode}`
  )
  const confirmMessageSyntax = sprintf(lstrings.create_wallet_account_make_payment_2s, existingCurrencyCode, existingWallet.name)

  const [isCreatingWallet, setIsCreatingWallet] = React.useState(true)
  const [walletId, setWalletId] = React.useState('')

  const paymentWallet = account.currencyWallets[walletId]
  const isRenderSelect = walletId === '' || walletAccountActivationQuoteError
  const paymentTokenId = paymentCurrencyCode === '' ? null : getWalletTokenId(paymentWallet, paymentCurrencyCode)

  const handleRenameAndReturnWallet = useHandler(async () => {
    await existingWallet.renameWallet(accountName)
    setIsCreatingWallet(false)
    return existingWallet
  })

  const handleSelect = useHandler(() => {
    Airship.show<WalletListResult>(bridge => (
      <WalletListModal bridge={bridge} navigation={props.navigation} headerTitle={lstrings.select_wallet} allowedAssets={supportedAssets} />
    ))
      .then(async result => {
        if (result?.type === 'wallet') {
          const { walletId, currencyCode } = result
          dispatch({ type: 'WALLET_ACCOUNT_ACTIVATION_ESTIMATE_ERROR', data: '' })
          setWalletId(walletId)
          const createdWalletInstance = await handleRenameAndReturnWallet()
          const paymentInfo: ActivationPaymentInfo = {
            requestedAccountName: accountName,
            currencyCode,
            ownerPublicKey: createdWalletInstance.publicWalletInfo.keys.ownerPublicKey,
            activePublicKey: createdWalletInstance.publicWalletInfo.keys.publicKey,
            requestedAccountCurrencyCode: existingCurrencyCode
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
    dispatch(logEvent('Activate_Wallet_Select'))
    dispatch(fetchAccountActivationInfo(existingPluginId)).catch(err => showError(err))
  }, [existingPluginId, dispatch])

  return (
    <SceneWrapper>
      <View style={styles.titleIconArea}>
        <CryptoIconUi4 sizeRem={4} pluginId={existingPluginId} tokenId={null} />
      </View>
      <View style={styles.createWalletPromptArea}>
        <EdgeText numberOfLines={10}>{isRenderSelect ? instructionSyntax : confirmMessageSyntax}</EdgeText>
      </View>

      <View style={styles.selectPaymentLower}>
        {isRenderSelect ? (
          <CardUi4>
            <View style={styles.paymentCostArea}>
              <EdgeText>{lstrings.create_wallet_account_amount_due}</EdgeText>
              <EdgeText style={styles.paymentRight}>
                {activationCost} {existingCurrencyCode}
              </EdgeText>
            </View>
          </CardUi4>
        ) : (
          <IconDataRow
            icon={<CryptoIconUi4 pluginId={paymentWallet.currencyInfo.pluginId} tokenId={null} sizeRem={2} />}
            leftText={getWalletName(paymentWallet)}
            leftSubtext={`${lstrings.send_confirmation_balance}: ${paymentWallet.balanceMap.get(paymentTokenId)} ${paymentCurrencyCode}`}
            rightText={`${paymentDenominationSymbol} ${amount} ${paymentCurrencyCode}`}
            rightSubText={`≈ ${activationCost} ${existingCurrencyCode}`}
          />
        )}
      </View>
      <View style={styles.buttonArea}>
        {isRenderSelect ? (
          <ButtonsViewUi4
            primary={{ disabled: !activationCost || activationCost === '', onPress: handleSelect, label: lstrings.create_wallet_account_select_wallet }}
            layout="column"
            parentType="scene"
          />
        ) : (
          <>
            <EdgeText style={styles.accountReviewConfirmText} numberOfLines={2}>
              {lstrings.create_wallet_account_confirm}
            </EdgeText>
            <ButtonsViewUi4
              primary={{ disabled: isCreatingWallet, onPress: handleSubmit, label: lstrings.legacy_address_modal_continue }}
              secondary={{ disabled: isCreatingWallet, onPress: handleCancel, label: lstrings.string_cancel_cap }}
              layout="column"
              parentType="scene"
            />
          </>
        )}
      </View>
    </SceneWrapper>
  )
})

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
