import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { createAccountTransaction, fetchAccountActivationInfo } from '../../actions/CreateWalletActions'
import { WalletListModal, WalletListResult } from '../../components/modals/WalletListModal'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getExchangeDenomByCurrencyCode } from '../../selectors/DenominationSelectors'
import { config } from '../../theme/appConfig'
import { useDispatch, useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { EdgeAsset } from '../../types/types'
import { getCurrencyCode, getWalletTokenId } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logEvent } from '../../util/tracking'
import { ButtonsView } from '../buttons/ButtonsView'
import { EdgeCard } from '../cards/EdgeCard'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { IconDataRow } from '../rows/IconDataRow'
import { Airship, showError } from '../services/AirshipInstance'
import { Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

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

export interface HandleActivationInfo {
  supportedAssets: EdgeAsset[]
  activationCost: string
}

export interface AccountActivationPaymentInfo {
  paymentAddress: string
  amount: string
  currencyCode: string
  exchangeAmount: string
  expireTime: number
}

interface Props extends EdgeAppSceneProps<'createWalletAccountSelect'> {
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
  const [activationPaymentInfo, setActivationPaymentInfo] = React.useState<AccountActivationPaymentInfo>({
    paymentAddress: '',
    amount: '',
    currencyCode: '',
    exchangeAmount: '',
    expireTime: 0
  })
  const paymentCurrencyCode = activationPaymentInfo.currencyCode
  const amount = activationPaymentInfo.amount
  const paymentDenominationSymbol =
    paymentCurrencyCode == null ? '' : getExchangeDenomByCurrencyCode(existingWallet.currencyConfig, paymentCurrencyCode).symbol ?? ''

  const [walletAccountActivationQuoteError, setWalletAccountActivationQuoteError] = React.useState('')
  const [{ supportedAssets, activationCost }, setAccountActivationInfo] = React.useState<HandleActivationInfo>({
    supportedAssets: [],
    activationCost: ''
  })

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
      <WalletListModal bridge={bridge} navigation={props.navigation as NavigationBase} headerTitle={lstrings.select_wallet} allowedAssets={supportedAssets} />
    ))
      .then(async result => {
        if (result?.type === 'wallet') {
          const { walletId, tokenId } = result
          const wallet = account.currencyWallets[walletId]
          setWalletAccountActivationQuoteError('')
          setWalletId(walletId)
          const createdWalletInstance = await handleRenameAndReturnWallet()
          const paymentInfo: ActivationPaymentInfo = {
            requestedAccountName: accountName,
            currencyCode: getCurrencyCode(wallet, tokenId),
            ownerPublicKey: createdWalletInstance.publicWalletInfo.keys.ownerPublicKey,
            activePublicKey: createdWalletInstance.publicWalletInfo.keys.publicKey,
            requestedAccountCurrencyCode: existingCurrencyCode
          }

          const networkTimeout = setTimeout(() => {
            showError('Network Timeout')
            setWalletAccountActivationQuoteError('Network Timeout')
          }, 26000)
          const activationInfo = await createdWalletInstance.otherMethods.getAccountActivationQuote(paymentInfo)
          clearTimeout(networkTimeout)
          setActivationPaymentInfo(activationInfo)
        }
      })
      .catch(err => showError(err))
  })

  const handleSubmit = useHandler(async () => {
    const createdWalletInstance = await handleRenameAndReturnWallet()
    dispatch(createAccountTransaction(props.navigation as NavigationBase, createdWalletInstance.id, accountName, walletId, activationPaymentInfo)).catch(err =>
      showError(err)
    )
  })

  const handleCancel = useHandler(() => setWalletId(''))

  useAsyncEffect(
    async () => {
      dispatch(logEvent('Activate_Wallet_Select'))
      const activationInfo = await fetchAccountActivationInfo(account, existingPluginId)
      setAccountActivationInfo(activationInfo)
    },
    [existingPluginId, dispatch],
    'createWalletAccountSelect'
  )

  return (
    <SceneWrapper>
      <View style={styles.titleIconArea}>
        <CryptoIcon sizeRem={4} pluginId={existingPluginId} tokenId={null} />
      </View>
      <View style={styles.createWalletPromptArea}>
        <EdgeText numberOfLines={10}>{isRenderSelect ? instructionSyntax : confirmMessageSyntax}</EdgeText>
      </View>

      <View style={styles.selectPaymentLower}>
        {isRenderSelect ? (
          <EdgeCard>
            <View style={styles.paymentCostArea}>
              <EdgeText>{lstrings.create_wallet_account_amount_due}</EdgeText>
              <EdgeText style={styles.paymentRight}>
                {activationCost} {existingCurrencyCode}
              </EdgeText>
            </View>
          </EdgeCard>
        ) : (
          <IconDataRow
            icon={<CryptoIcon pluginId={paymentWallet.currencyInfo.pluginId} tokenId={null} sizeRem={2} />}
            leftText={getWalletName(paymentWallet)}
            leftSubtext={`${lstrings.send_confirmation_balance}: ${paymentWallet.balanceMap.get(paymentTokenId)} ${paymentCurrencyCode}`}
            rightText={`${paymentDenominationSymbol} ${amount} ${paymentCurrencyCode}`}
            rightSubText={`≈ ${activationCost} ${existingCurrencyCode}`}
          />
        )}
      </View>
      <View style={styles.buttonArea}>
        {isRenderSelect ? (
          <ButtonsView
            primary={{ disabled: !activationCost || activationCost === '', onPress: handleSelect, label: lstrings.create_wallet_account_select_wallet }}
            layout="column"
            parentType="scene"
          />
        ) : (
          <>
            <EdgeText style={styles.accountReviewConfirmText} numberOfLines={2}>
              {lstrings.create_wallet_account_confirm}
            </EdgeText>
            <ButtonsView
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
