import { div, gt, lte, mul } from 'biggystring'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { cacheStyles } from 'react-native-patina'
import { sprintf } from 'sprintf-js'

import { guiPlugins } from '../../../constants/plugins/GuiPlugins'
import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { dryrunActionProgram } from '../../../controllers/action-queue/runtime/dryrunActionProgram'
import { ActionOp, ActionProgram } from '../../../controllers/action-queue/types'
import { makeInitialProgramState } from '../../../controllers/action-queue/util/makeInitialProgramState'
import { makeWyreClient, PaymentMethodsMap } from '../../../controllers/action-queue/WyreClient'
import { runLoanActionProgram } from '../../../controllers/loan-manager/redux/actions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useExecutionContext } from '../../../hooks/useExecutionContext'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import s from '../../../locales/strings'
import { BorrowCollateral, BorrowDebt } from '../../../plugins/borrow-plugins/types'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { Actions, NavigationProp, RouteProp } from '../../../types/routerTypes'
import { LoanAsset, makeAaveBorrowAction, makeAaveDepositAction } from '../../../util/ActionProgramUtils'
import { useTotalFiatAmount } from '../../../util/borrowUtils'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { guessFromCurrencyCode } from '../../../util/CurrencyInfoHelpers'
import { getExecutionNetworkFees } from '../../../util/networkFeeUtils'
import { DECIMAL_PRECISION, zeroString } from '../../../util/utils'
import { FiatAmountInputCard } from '../../cards/FiatAmountInputCard'
import { SelectableAsset, TappableAccountCard } from '../../cards/TappableAccountCard'
import { Space } from '../../layout/Space'
import { WalletListModal, WalletListResult } from '../../modals/WalletListModal'
import { FillLoader } from '../../progress-indicators/FillLoader'
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

export type LoanManageActionOpType = 'loan-deposit' | 'loan-withdraw' | 'loan-borrow' | 'loan-repay'

// User input display strings
const ACTIONOP_TYPE_STRING_MAP: { [key: string]: { headerText: string; amountCard: string; srcDestCardPrimary: string; srcDestCardSecondary?: string } } = {
  'loan-deposit': {
    headerText: s.strings.loan_add_collateral,
    amountCard: s.strings.loan_fragment_deposit,
    srcDestCardPrimary: s.strings.loan_fund_source
  },
  'loan-withdraw': {
    headerText: s.strings.loan_withdraw_collateral,
    amountCard: s.strings.loan_fragment_withdraw,
    srcDestCardPrimary: s.strings.loan_fund_destination
  },
  'loan-borrow': {
    headerText: s.strings.loan_borrow_more,
    amountCard: s.strings.loan_fragment_loan,
    srcDestCardPrimary: s.strings.loan_fund_destination
  },
  'loan-repay': {
    headerText: s.strings.loan_make_payment,
    amountCard: s.strings.loan_fragment_repay,
    srcDestCardPrimary: s.strings.loan_payment_destination,
    srcDestCardSecondary: s.strings.loan_payment_source
  }
} as const

interface Props {
  navigation: NavigationProp<'loanManage'>
  route: RouteProp<'loanManage'>
}

export const LoanManageScene = (props: Props) => {
  // -----------------------------------------------------------------------------
  // #region Constants
  // -----------------------------------------------------------------------------
  const { navigation, route } = props
  const { actionOpType, loanAccountId } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()
  const account = useSelector(state => state.core.account)
  const clientId = useSelector(state => state.core.context.clientId)
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const executionContext = useExecutionContext()

  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine, borrowPlugin } = loanAccount
  const { currencyWallet: borrowEngineWallet } = loanAccount.borrowEngine
  const { fiatCurrencyCode: isoFiatCurrencyCode, currencyInfo: borrowEngineCurrencyInfo } = borrowEngineWallet
  const actionOpStrings = ACTIONOP_TYPE_STRING_MAP[actionOpType]
  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
  const borrowEnginePluginId = borrowEngineCurrencyInfo.pluginId
  const borrowPluginInfo = borrowPlugin.borrowInfo
  const borrowPluginId = borrowPluginInfo.borrowPluginId
  const isShowAprChange = actionOpType === 'loan-repay' || actionOpType === 'loan-borrow'

  // Src/dest Wallet Picker
  const wallets = useWatch(account, 'currencyWallets')
  const { tokenId: hardDebtAddr } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: 'USDC', pluginId: borrowEnginePluginId }),
    [account, borrowEnginePluginId]
  )
  const { tokenId: hardCollateralAddr } = React.useMemo(
    () => guessFromCurrencyCode(account, { currencyCode: 'WBTC', pluginId: borrowEnginePluginId }),
    [account, borrowEnginePluginId]
  )
  const excludeWalletIds = Object.keys(wallets).filter(walletId => walletId !== borrowEngineWallet.id)
  const hardAllowedCollateralAsset = [{ pluginId: borrowEnginePluginId, tokenId: hardCollateralAddr }, { pluginId: 'bitcoin' }]
  const hardAllowedDebtAsset = [{ pluginId: borrowEnginePluginId, tokenId: hardDebtAddr }]

  // Selected debt/collateral
  const sceneType = ['loan-borrow', 'loan-repay'].includes(actionOpType) ? 'debts' : 'collaterals'
  const isSceneTypeDebts = sceneType === 'debts'
  const defaultTokenId = isSceneTypeDebts ? hardDebtAddr : hardCollateralAddr

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
  const [selectedPrimaryAsset, setSelectedAsset] = React.useState<SelectableAsset>({ wallet: borrowEngineWallet, tokenId: defaultTokenId })
  const [pendingDebtOrCollateral, setPendingDebtOrCollateral] = React.useState<BorrowDebt | BorrowCollateral>({
    nativeAmount: '0',
    tokenId: selectedPrimaryAsset.tokenId,
    apr: 0
  })

  const [bankAccountsMap] = useAsyncValue<PaymentMethodsMap>(async (): Promise<PaymentMethodsMap> => {
    if (account == null) return {}
    const wyreClient = await makeWyreClient({ account })
    if (!wyreClient.isAccountSetup) return {}
    return await wyreClient.getPaymentMethods()
  }, [account])

  // New debt/collateral amount
  const amountChange = actionOpType === 'loan-borrow' || actionOpType === 'loan-deposit' ? 'increase' : 'decrease'
  const actionAmountSign = amountChange === 'increase' ? '1' : '-1'

  // APR change
  const newDebt = { nativeAmount: actionNativeAmount, tokenId: selectedPrimaryAsset.tokenId, apr: newDebtApr }

  // LTV exceeded checks
  const pendingDebts = isSceneTypeDebts ? [...debts, pendingDebtOrCollateral] : debts
  const pendingDebtsFiatValue = useTotalFiatAmount(borrowEngineWallet, pendingDebts)
  const pendingCollaterals = isSceneTypeDebts ? collaterals : [...collaterals, pendingDebtOrCollateral]
  const pendingCollateralsFiatValue = useTotalFiatAmount(borrowEngineWallet, pendingCollaterals)

  // TODO: When new asset support is added, we need to implement calculation of aggregated liquidation thresholds
  const hardLtvRatio = '0.74'
  const isLtvExceeded =
    (actionOpType === 'loan-borrow' || actionOpType === 'loan-withdraw') &&
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

    if (actionOpType === 'loan-withdraw') {
      availableNativeAmount = collaterals.find(collateral => collateral.tokenId === selectedPrimaryAsset.tokenId)?.nativeAmount
    } else if (actionOpType === 'loan-repay') {
      availableNativeAmount = debts.find(debt => debt.tokenId === selectedPrimaryAsset.tokenId)?.nativeAmount
    } else {
      availableNativeAmount = undefined // Use uncapped actionNativeAmount
    }

    const cappedActionNativeAmount = availableNativeAmount != null && gt(actionNativeAmount, availableNativeAmount) ? availableNativeAmount : actionNativeAmount

    setPendingDebtOrCollateral({ nativeAmount: mul(actionAmountSign, cappedActionNativeAmount), tokenId: selectedPrimaryAsset.tokenId, apr: 0 })

    return () => {}
  }, [actionNativeAmount, selectedPrimaryAsset.tokenId])

  // Build Action Program
  useAsyncEffect(async () => {
    if (zeroString(actionNativeAmount) || isLtvExceeded) {
      setActionProgram(undefined)
    } else {
      let actionOp: ActionOp
      switch (actionOpType) {
        case 'loan-deposit':
          actionOp = await makeAaveDepositAction({
            borrowPluginId,
            depositTokenId: hardAllowedCollateralAsset[0].tokenId,
            nativeAmount: actionNativeAmount,
            borrowEngineWallet: borrowEngineWallet,
            srcTokenId: selectedPrimaryAsset.tokenId,
            srcWallet: borrowEngineWallet
          })
          break
        case 'loan-borrow':
          {
            const destination: LoanAsset = {
              wallet: borrowEngineWallet,
              tokenId: selectedPrimaryAsset.tokenId,
              nativeAmount: actionNativeAmount,
              ...(selectedPrimaryAsset.paymentMethod != null ? { paymentMethodId: selectedPrimaryAsset.paymentMethod.id } : {}),
              ...(selectedPrimaryAsset.tokenId != null ? { tokenId: selectedPrimaryAsset.tokenId } : {})
            }
            actionOp = await makeAaveBorrowAction({
              borrowEngineWallet,
              borrowPluginId,
              destination
            })
          }
          break
        default: {
          actionOp = {
            type: 'seq',
            actions: [
              {
                type: actionOpType,
                borrowPluginId,
                nativeAmount: actionNativeAmount,
                walletId: borrowEngineWallet.id,
                tokenId: selectedPrimaryAsset.tokenId
              }
            ]
          }
        }
      }
      setActionProgram(await makeActionProgram(actionOp))
    }
  }, [actionNativeAmount, actionOpType, borrowEngineWallet, borrowPluginId, isLtvExceeded, selectedPrimaryAsset])

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
      const apr = await borrowEngine.getAprQuote(selectedPrimaryAsset.tokenId)
      setNewDebtApr(apr)
    }
    return () => {}
  }, [borrowEngine, selectedPrimaryAsset.tokenId, isShowAprChange])

  // #endregion Hooks

  // -----------------------------------------------------------------------------
  // #region Handlers
  // -----------------------------------------------------------------------------

  const handleFiatAmountChanged = useHandler((fiatAmount, nativeCryptoAmount) => {
    setActionNativeAmount(nativeCryptoAmount)
  })

  const handleSliderComplete = useHandler(async (resetSlider: () => void) => {
    if (actionProgram != null) {
      try {
        await dispatch(runLoanActionProgram(loanAccount, actionProgram, actionOpType))

        // HACK: Until Main.ui fully deprecates Actions usage, use this hack to handle back button routing.
        Actions.replace('loanStatus', { actionQueueId: actionProgram.programId, loanAccountId: loanAccount.id })
      } catch (e: any) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  })

  const handleShowPrimaryWalletPicker = useHandler(() => {
    if (bankAccountsMap == null) return

    Airship.show((bridge: AirshipBridge<WalletListResult>) => (
      <WalletListModal
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
        showCreateWallet={isSceneTypeDebts}
        createWalletId={isSceneTypeDebts ? borrowEngineWallet.id : undefined}
        showBankOptions={actionOpType === 'loan-borrow'}
        excludeWalletIds={isSceneTypeDebts ? excludeWalletIds : undefined}
        allowedAssets={isSceneTypeDebts ? hardAllowedDebtAsset : hardAllowedCollateralAsset}
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
          setSelectedAsset({ wallet: borrowEngineWallet, tokenId: hardDebtAddr, paymentMethod })
        } else if (walletId != null && currencyCode != null) {
          const selectedWallet = wallets[walletId]
          const { tokenId } = guessFromCurrencyCode(account, { currencyCode, pluginId: selectedWallet.currencyInfo.pluginId })
          setSelectedAsset({ wallet: selectedWallet, tokenId })
        }
      })
      .catch(e => showError(e.message))
  })

  // #endregion Handlers

  return bankAccountsMap == null ? (
    <FillLoader />
  ) : (
    <FormScene headerText={actionOpStrings.headerText} onSliderComplete={handleSliderComplete} sliderDisabled={actionProgram == null}>
      <Space vertical around={0.5}>
        <FiatAmountInputCard
          wallet={borrowEngineWallet}
          iconUri={iconUri}
          inputModalMessage={sprintf(s.strings.loan_must_be_s_or_less)}
          title={sprintf(s.strings.loan_enter_s_amount_s, actionOpStrings.amountCard, fiatCurrencyCode)}
          tokenId={selectedPrimaryAsset.tokenId}
          onAmountChanged={handleFiatAmountChanged}
        />
        {isShowAprChange ? <AprCard apr={newDebtApr} key="apr" /> : null}
        <EdgeText style={styles.textTitle}>{actionOpStrings.srcDestCardPrimary}</EdgeText>
        <TappableAccountCard emptyLabel={s.strings.loan_select_receiving_wallet} selectedAsset={selectedPrimaryAsset} onPress={handleShowPrimaryWalletPicker} />
        <EdgeText style={styles.textTitle}>{actionOpStrings.srcDestCardSecondary}</EdgeText>
        <TappableAccountCard
          emptyLabel={s.strings.loan_select_receiving_wallet}
          selectedAsset={selectedSecondaryAsset}
          onPress={handleShowSecondaryWalletPicker}
        />
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
          tokenId={selectedPrimaryAsset.tokenId}
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
