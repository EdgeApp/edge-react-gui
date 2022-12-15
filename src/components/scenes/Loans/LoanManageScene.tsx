import { div, gt, lte, mul } from 'biggystring'
import * as React from 'react'
import { TouchableOpacity } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { cacheStyles } from 'react-native-patina'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { AAVE_SUPPORT_ARTICLE_URL_1S } from '../../../constants/aaveConstants'
import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { dryrunActionProgram } from '../../../controllers/action-queue/runtime/dryrunActionProgram'
import { ActionOp, ActionProgram } from '../../../controllers/action-queue/types'
import { makeInitialProgramState } from '../../../controllers/action-queue/util/makeInitialProgramState'
import { makeWyreClient, PaymentMethodsMap } from '../../../controllers/action-queue/WyreClient'
import { runLoanActionProgram } from '../../../controllers/loan-manager/redux/actions'
import { LoanProgramType } from '../../../controllers/loan-manager/store'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useExecutionContext } from '../../../hooks/useExecutionContext'
import { useHandler } from '../../../hooks/useHandler'
import { useUrlHandler } from '../../../hooks/useUrlHandler'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import s from '../../../locales/strings'
import { BorrowCollateral, BorrowDebt } from '../../../plugins/borrow-plugins/types'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { Actions, NavigationProp, RouteProp } from '../../../types/routerTypes'
import { LoanAsset, makeAaveBorrowAction, makeAaveDepositAction } from '../../../util/ActionProgramUtils'
import { getWalletPickerExcludeWalletIds, useTotalFiatAmount } from '../../../util/borrowUtils'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getExecutionNetworkFees } from '../../../util/networkFeeUtils'
import { DECIMAL_PRECISION, zeroString } from '../../../util/utils'
import { FiatAmountInputCard } from '../../cards/FiatAmountInputCard'
import { SelectableAsset, TappableAccountCard } from '../../cards/TappableAccountCard'
import { withLoanAccount } from '../../hoc/withLoanAccount'
import { Peek } from '../../layout/Peek'
import { Space } from '../../layout/Space'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { Shimmer } from '../../progress-indicators/Shimmer'
import { Airship, showError } from '../../services/AirshipInstance'
import { Theme, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { AprCard } from '../../tiles/AprCard'
import { InterestRateChangeTile } from '../../tiles/InterestRateChangeTile'
import { LtvRatioTile } from '../../tiles/LtvRatioTile'
import { NetworkFeeTile } from '../../tiles/NetworkFeeTile'
import { TotalDebtCollateralTile } from '../../tiles/TotalDebtCollateralTile'
import { FormScene } from '../FormScene'

export type LoanManageType = 'loan-manage-deposit' | 'loan-manage-withdraw' | 'loan-manage-borrow' | 'loan-manage-repay'

// User input display strings
const MANAGE_ACTION_DATA_MAP: {
  [key: string]: { headerText: string; amountCard: string; srcDestCard: string; supportUrl: string; programType: LoanProgramType }
} = {
  'loan-manage-deposit': {
    headerText: s.strings.loan_add_collateral,
    amountCard: s.strings.loan_fragment_deposit,
    srcDestCard: s.strings.loan_fund_source,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'add-collateral'),
    programType: 'loan-deposit'
  },
  'loan-manage-withdraw': {
    headerText: s.strings.loan_withdraw_collateral,
    amountCard: s.strings.loan_fragment_withdraw,
    srcDestCard: s.strings.loan_fund_destination,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'withdraw-collateral'),
    programType: 'loan-withdraw'
  },
  'loan-manage-borrow': {
    headerText: s.strings.loan_borrow_more,
    amountCard: s.strings.loan_fragment_loan,
    srcDestCard: s.strings.loan_fund_destination,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'borrow-more'),
    programType: 'loan-borrow'
  },
  'loan-manage-repay': {
    headerText: s.strings.loan_make_payment,
    amountCard: s.strings.loan_fragment_repay,
    srcDestCard: s.strings.loan_fund_source,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'make-payment'),
    programType: 'loan-repay'
  }
}

const sceneTypeMap = {
  'loan-manage-borrow': 'debts',
  'loan-manage-repay': 'debts',
  'loan-manage-withdraw': 'collaterals',
  'loan-manage-deposit': 'collaterals'
} as const

interface Props {
  navigation: NavigationProp<'loanManage'>
  route: RouteProp<'loanManage'>
  loanAccount: LoanAccount
}

export const LoanManageSceneComponent = (props: Props) => {
  // -----------------------------------------------------------------------------
  // #region Constants
  // -----------------------------------------------------------------------------
  const { navigation, route, loanAccount } = props
  const { loanManageType } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const clientId = useSelector(state => state.core.context.clientId)

  const executionContext = useExecutionContext()

  const { borrowEngine, borrowPlugin } = loanAccount
  const { currencyWallet: borrowEngineWallet } = loanAccount.borrowEngine
  const { fiatCurrencyCode: isoFiatCurrencyCode, currencyInfo: borrowEngineCurrencyInfo } = borrowEngineWallet
  const manageActionData = MANAGE_ACTION_DATA_MAP[loanManageType]
  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
  const borrowEnginePluginId = borrowEngineCurrencyInfo.pluginId
  const borrowPluginInfo = borrowPlugin.borrowInfo
  const borrowPluginId = borrowPluginInfo.borrowPluginId
  const isShowAprChange = loanManageType === 'loan-manage-repay' || loanManageType === 'loan-manage-borrow'

  // Src/dest Wallet Picker
  const wallets = useWatch(account, 'currencyWallets')
  const { tokenId: hardDebtTokenId } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: 'USDC', pluginId: borrowEnginePluginId }),
    [account, borrowEnginePluginId]
  )
  const { tokenId: hardCollateralTokenId } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: 'WBTC', pluginId: borrowEnginePluginId }),
    [account, borrowEnginePluginId]
  )
  const hardAllowedCollateralAssets = [{ pluginId: borrowEnginePluginId, tokenId: hardCollateralTokenId }]
  if (loanManageType === 'loan-manage-deposit') hardAllowedCollateralAssets.push({ pluginId: 'bitcoin', tokenId: undefined })
  const hardAllowedDebtAsset = [{ pluginId: borrowEnginePluginId, tokenId: hardDebtTokenId }]

  // Selected debt/collateral
  const sceneType = sceneTypeMap[loanManageType]
  const isSceneTypeDebts = sceneType === 'debts'
  const defaultTokenId = isSceneTypeDebts ? hardDebtTokenId : hardCollateralTokenId

  // Amount card
  const iconUri = getBorrowPluginIconUri(borrowPluginInfo)
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')

  // #endregion Constants

  // -----------------------------------------------------------------------------
  // #region State
  // -----------------------------------------------------------------------------

  const [actionNativeAmount, setActionNativeAmount] = React.useState('0')
  const [newDebtApr, setNewDebtApr] = React.useState(0)
  const [actionProgram, setActionProgram] = React.useState<ActionProgram | undefined>(undefined)
  const [selectedAsset, setSelectedAsset] = React.useState<SelectableAsset>({ wallet: borrowEngineWallet, tokenId: defaultTokenId })
  const [pendingDebtOrCollateral, setPendingDebtOrCollateral] = React.useState<BorrowDebt | BorrowCollateral>({
    nativeAmount: '0',
    tokenId: selectedAsset.tokenId,
    apr: 0
  })

  const [bankAccountsMap] = useAsyncValue<PaymentMethodsMap>(async (): Promise<PaymentMethodsMap> => {
    try {
      if (account == null) return {}
      const wyreClient = await makeWyreClient({ account })
      if (!wyreClient.isAccountSetup) return {}
      return await wyreClient.getPaymentMethods()
    } catch (e: any) {
      console.warn(`Failed to get Wyre payment methods: ${e}`)
      return {}
    }
  }, [account])

  // New debt/collateral amount
  const amountChange = loanManageType === 'loan-manage-borrow' || loanManageType === 'loan-manage-deposit' ? 'increase' : 'decrease'
  const actionAmountSign = amountChange === 'increase' ? '1' : '-1'

  // APR change
  const newDebt = { nativeAmount: actionNativeAmount, tokenId: selectedAsset.tokenId, apr: newDebtApr }

  // LTV exceeded checks
  const pendingDebts = isSceneTypeDebts ? [...debts, pendingDebtOrCollateral] : debts
  const pendingDebtsFiatValue = useTotalFiatAmount(borrowEngineWallet, pendingDebts)
  const pendingCollaterals = isSceneTypeDebts ? collaterals : [...collaterals, pendingDebtOrCollateral]
  const pendingCollateralsFiatValue = useTotalFiatAmount(borrowEngineWallet, pendingCollaterals)

  // TODO: When new asset support is added, we need to implement calculation of aggregated liquidation thresholds
  const hardLtvRatio = '0.74'
  const isLtvExceeded =
    (loanManageType === 'loan-manage-borrow' || loanManageType === 'loan-manage-withdraw') &&
    (lte(pendingCollateralsFiatValue, '0') || // Extra redundancy for withdrawing more than available collateral
      gt(div(pendingDebtsFiatValue, pendingCollateralsFiatValue, DECIMAL_PRECISION), hardLtvRatio)) // Requested borrow or withdraw results in exceeding LTV

  // #endregion State

  // -----------------------------------------------------------------------------
  // #region Hooks
  // -----------------------------------------------------------------------------

  // TODO: Full max button implementation and behavior
  // Withdraw/repay ceilings
  useAsyncEffect(async () => {
    let availableNativeAmount: string | undefined

    if (loanManageType === 'loan-manage-withdraw') {
      availableNativeAmount = collaterals.find(collateral => collateral.tokenId === selectedAsset.tokenId)?.nativeAmount
    } else if (loanManageType === 'loan-manage-repay') {
      availableNativeAmount = debts.find(debt => debt.tokenId === selectedAsset.tokenId)?.nativeAmount
    } else {
      availableNativeAmount = undefined // Use uncapped actionNativeAmount
    }

    const cappedActionNativeAmount = availableNativeAmount != null && gt(actionNativeAmount, availableNativeAmount) ? availableNativeAmount : actionNativeAmount

    setPendingDebtOrCollateral({ nativeAmount: mul(actionAmountSign, cappedActionNativeAmount), tokenId: selectedAsset.tokenId, apr: 0 })

    return () => {}
  }, [actionNativeAmount, selectedAsset.tokenId])

  // Build Action Program
  useAsyncEffect(async () => {
    if (zeroString(actionNativeAmount) || isLtvExceeded) {
      setActionProgram(undefined)
    } else {
      let actionOp: ActionOp
      switch (loanManageType) {
        case 'loan-manage-deposit':
          actionOp = await makeAaveDepositAction({
            borrowPluginId,
            depositTokenId: hardAllowedCollateralAssets[0].tokenId,
            nativeAmount: actionNativeAmount,
            borrowEngineWallet: borrowEngineWallet,
            srcTokenId: selectedAsset.tokenId,
            srcWallet: selectedAsset.wallet ?? borrowEngineWallet
          })
          break
        case 'loan-manage-borrow':
          {
            const destination: LoanAsset = {
              wallet: borrowEngineWallet,
              tokenId: selectedAsset.tokenId,
              nativeAmount: actionNativeAmount,
              ...(selectedAsset.paymentMethod != null ? { paymentMethodId: selectedAsset.paymentMethod.id } : {}),
              ...(selectedAsset.tokenId != null ? { tokenId: selectedAsset.tokenId } : {})
            }
            actionOp = await makeAaveBorrowAction({
              borrowEngineWallet,
              borrowPluginId,
              destination
            })
          }
          break
        case 'loan-manage-repay':
          actionOp = {
            type: 'seq',
            actions: [
              {
                type: 'loan-repay',
                borrowPluginId,
                nativeAmount: actionNativeAmount,
                walletId: borrowEngineWallet.id,
                tokenId: selectedAsset.tokenId
              }
            ]
          }
          break
        case 'loan-manage-withdraw':
          actionOp = {
            type: 'seq',
            actions: [
              {
                type: 'loan-withdraw',
                borrowPluginId,
                nativeAmount: actionNativeAmount,
                walletId: borrowEngineWallet.id,
                tokenId: selectedAsset.tokenId
              }
            ]
          }
          break
      }
      setActionProgram(await makeActionProgram(actionOp))
    }
  }, [actionNativeAmount, loanManageType, borrowEngineWallet, borrowPluginId, isLtvExceeded, selectedAsset])

  // Get Network Fees
  const [networkFeeMap = {}] = useAsyncValue(async () => {
    if (actionProgram != null) {
      const executionOutputs = await dryrunActionProgram(executionContext, actionProgram, makeInitialProgramState(clientId, actionProgram.programId), false)
      return getExecutionNetworkFees(executionOutputs)
    } else {
      return {}
    }
  }, [account, actionProgram, clientId])

  // APR
  useAsyncEffect(async () => {
    if (isShowAprChange) {
      const apr = await borrowEngine.getAprQuote(selectedAsset.tokenId)
      setNewDebtApr(apr)
    }
    return () => {}
  }, [borrowEngine, selectedAsset.tokenId, isShowAprChange])

  // #endregion Hooks

  // -----------------------------------------------------------------------------
  // #region Handlers
  // -----------------------------------------------------------------------------

  const handleFiatAmountChanged = useHandler((fiatAmount, nativeCryptoAmount) => {
    setActionNativeAmount(nativeCryptoAmount)
  })

  const handleInfoIconPress = useUrlHandler(manageActionData.supportUrl)

  const handleSliderComplete = useHandler(async (resetSlider: () => void) => {
    if (actionProgram != null) {
      try {
        await dispatch(runLoanActionProgram(loanAccount, actionProgram, manageActionData.programType))

        // Route to LoanStatusScene only if Action Program contains multiple ops
        const seq = actionProgram.actionOp.type === 'seq' ? actionProgram.actionOp : null
        if (seq != null && seq.actions.length > 1) {
          // HACK: Until Main.ui fully deprecates Actions usage, use this hack to handle back button routing.
          Actions.replace('loanStatus', { actionQueueId: actionProgram.programId, loanAccountId: loanAccount.id })
        } else {
          navigation.navigate('loanDetails', { loanAccountId: loanAccount.id })
        }
      } catch (e: any) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  })

  const handleShowWalletPickerModal = useHandler(() => {
    if (bankAccountsMap == null) return

    Airship.show((bridge: AirshipBridge<WalletListResult>) => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        showCreateWallet
        createWalletId={isSceneTypeDebts ? borrowEngineWallet.id : undefined}
        showBankOptions={loanManageType === 'loan-manage-borrow'}
        excludeWalletIds={getWalletPickerExcludeWalletIds(wallets, loanManageType, borrowEngineWallet)}
        allowedAssets={isSceneTypeDebts ? hardAllowedDebtAsset : hardAllowedCollateralAssets}
        filterActivation
      />
    ))
      .then(async ({ walletId, currencyCode, isBankSignupRequest, wyreAccountId }) => {
        if (isBankSignupRequest) {
          // Open bank plugin for new user signup
          navigation.navigate('pluginView', {
            plugin: guiPlugins.wyre,
            deepPath: '',
            deepQuery: {}
          })
        } else if (wyreAccountId != null) {
          const paymentMethod = bankAccountsMap[wyreAccountId]
          // Set a hard-coded intermediate AAVE loan destination asset (USDC) to
          // use for the bank sell step that comes after the initial loan
          setSelectedAsset({ wallet: borrowEngineWallet, tokenId: hardDebtTokenId, paymentMethod })
        } else if (walletId != null && currencyCode != null) {
          const selectedWallet = wallets[walletId]
          const { tokenId } = guessFromCurrencyCode(account, { currencyCode, pluginId: selectedWallet.currencyInfo.pluginId })
          setSelectedAsset({ wallet: selectedWallet, tokenId })
        }
      })
      .catch(e => showError(e.message))
  })

  // #endregion Handlers

  return (
    <FormScene
      headerText={manageActionData.headerText}
      onSliderComplete={handleSliderComplete}
      sliderDisabled={actionProgram == null}
      headerTertiary={
        <TouchableOpacity onPress={handleInfoIconPress}>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </TouchableOpacity>
      }
    >
      <Space vertical around={0.5}>
        <FiatAmountInputCard
          wallet={borrowEngineWallet}
          iconUri={iconUri}
          inputModalMessage={sprintf(s.strings.loan_loan_amount_input_message_s, toPercentString(borrowPlugin.borrowInfo.maxLtvRatio.toString()))}
          title={sprintf(s.strings.loan_enter_s_amount_s, manageActionData.amountCard, fiatCurrencyCode)}
          tokenId={selectedAsset.tokenId}
          onAmountChanged={handleFiatAmountChanged}
        />
        {isShowAprChange ? <AprCard apr={newDebtApr} key="apr" /> : null}
        <EdgeText style={styles.textTitle}>{manageActionData.srcDestCard}</EdgeText>
        <Space around={0.5}>
          <Shimmer isShown={bankAccountsMap == null} />
          <Peek isShown={bankAccountsMap != null}>
            <TappableAccountCard emptyLabel={s.strings.loan_select_receiving_wallet} selectedAsset={selectedAsset} onPress={handleShowWalletPickerModal} />
          </Peek>
        </Space>
      </Space>
      <Space vertical around={0.25}>
        <TotalDebtCollateralTile
          title={isSceneTypeDebts ? s.strings.loan_current_principal : s.strings.loan_current_collateral}
          wallet={borrowEngineWallet}
          debtsOrCollaterals={isSceneTypeDebts ? debts : collaterals}
          key="currentAmount"
        />
        <TotalDebtCollateralTile
          title={isSceneTypeDebts ? s.strings.loan_new_principal : s.strings.loan_new_collateral}
          wallet={borrowEngineWallet}
          debtsOrCollaterals={isSceneTypeDebts ? pendingDebts : pendingCollaterals}
          key="newAmount"
        />
        <TotalDebtCollateralTile
          title={isSceneTypeDebts ? s.strings.loan_collateral_value : s.strings.loan_principal_value}
          wallet={borrowEngineWallet}
          debtsOrCollaterals={isSceneTypeDebts ? collaterals : debts}
          key="counterAsset"
        />
        <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={networkFeeMap[borrowEngineWallet.currencyInfo.currencyCode]?.nativeAmount ?? '0'} key="fee" />
        {isShowAprChange ? <InterestRateChangeTile borrowEngine={borrowEngine} newDebt={newDebt} key="interestRate" /> : null}
        <LtvRatioTile
          borrowEngine={borrowEngine}
          tokenId={selectedAsset.tokenId}
          nativeAmount={actionNativeAmount}
          type={sceneType}
          direction={amountChange}
          key="ltv"
        />
        {isLtvExceeded && (
          <Alert
            numberOfLines={0}
            marginRem={[1.5, 0.5, -0.75, 0.5]}
            title={s.strings.exchange_insufficient_funds_title}
            message={sprintf(s.strings.loan_amount_exceeds_s_collateral, toPercentString(hardLtvRatio))}
            type="error"
          />
        )}
      </Space>
    </FormScene>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  return {
    textTitle: {
      alignSelf: 'flex-start',
      color: theme.secondaryText,
      fontFamily: theme.fontFaceBold,
      fontSize: theme.rem(0.75),
      marginLeft: theme.rem(0.75),
      marginBottom: theme.rem(0.5),
      marginTop: theme.rem(1),
      textAlign: 'left'
    }
  }
})

export const LoanManageScene = withLoanAccount(LoanManageSceneComponent)
