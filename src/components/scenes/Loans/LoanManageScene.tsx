import { add, gt, max, mul } from 'biggystring'
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
import { PaymentMethodsMap } from '../../../controllers/action-queue/WyreClient'
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
import { lstrings } from '../../../locales/strings'
import { BorrowCollateral, BorrowDebt } from '../../../plugins/borrow-plugins/types'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { LoanAsset, makeAaveBorrowAction, makeAaveDepositAction } from '../../../util/ActionProgramUtils'
import { getWalletPickerExcludeWalletIds } from '../../../util/borrowUtils'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { getTokenId } from '../../../util/CurrencyInfoHelpers'
import { getExecutionNetworkFees } from '../../../util/networkFeeUtils'
import { zeroString } from '../../../util/utils'
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

export type LoanManageType = 'loan-manage-borrow' | 'loan-manage-deposit' | 'loan-manage-repay' | 'loan-manage-withdraw'

// User input display strings
const MANAGE_ACTION_DATA_MAP: {
  [key: string]: {
    actionSide: 'debts' | 'collaterals'
    amountCard: string
    headerText: string
    isFundDestWallet: boolean
    programType: LoanProgramType
    srcDestCard: string
    supportUrl: string
  }
} = {
  'loan-manage-borrow': {
    actionSide: 'debts',
    amountCard: lstrings.loan_fragment_loan,
    headerText: lstrings.loan_borrow_more,
    isFundDestWallet: true,
    programType: 'loan-borrow',
    srcDestCard: lstrings.loan_fund_destination,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'borrow-more')
  },
  'loan-manage-deposit': {
    actionSide: 'collaterals',
    amountCard: lstrings.loan_fragment_deposit,
    headerText: lstrings.loan_add_collateral,
    isFundDestWallet: false,
    programType: 'loan-deposit',
    srcDestCard: lstrings.loan_fund_source,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'add-collateral')
  },
  'loan-manage-repay': {
    actionSide: 'debts',
    amountCard: lstrings.loan_fragment_repay,
    headerText: lstrings.loan_make_payment,
    isFundDestWallet: false,
    programType: 'loan-repay',
    srcDestCard: lstrings.loan_fund_source,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'make-payment')
  },
  'loan-manage-withdraw': {
    actionSide: 'collaterals',
    amountCard: lstrings.loan_fragment_withdraw,
    headerText: lstrings.loan_withdraw_collateral,
    isFundDestWallet: true,
    programType: 'loan-withdraw',
    srcDestCard: lstrings.loan_fund_destination,
    supportUrl: sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'withdraw-collateral')
  }
}

interface Props extends EdgeSceneProps<'loanManage'> {
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
  const hardDebtTokenId = React.useMemo(() => getTokenId(account, borrowEnginePluginId, 'USDC'), [account, borrowEnginePluginId])
  const hardCollateralTokenId = React.useMemo(() => getTokenId(account, borrowEnginePluginId, 'WBTC'), [account, borrowEnginePluginId])
  const hardAllowedCollateralAssets = [{ pluginId: borrowEnginePluginId, tokenId: hardCollateralTokenId }]
  if (loanManageType === 'loan-manage-deposit') hardAllowedCollateralAssets.push({ pluginId: 'bitcoin', tokenId: undefined })
  const hardAllowedDebtAssets = [{ pluginId: borrowEnginePluginId, tokenId: hardDebtTokenId }]

  // Selected debt/collateral
  const isActionSideDebts = manageActionData.actionSide === 'debts'
  const defaultTokenId = isActionSideDebts ? hardDebtTokenId : hardCollateralTokenId

  // Amount card
  const iconUri = getBorrowPluginIconUri(borrowPluginInfo)
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')

  // #endregion Constants

  // -----------------------------------------------------------------------------
  // #region State
  // -----------------------------------------------------------------------------

  const [actionNativeAmount, setActionNativeAmount] = React.useState('0')
  const [newApr, setNewApr] = React.useState(0)
  const [actionProgram, setActionProgram] = React.useState<ActionProgram | undefined>(undefined)
  const [selectedAsset, setSelectedAsset] = React.useState<SelectableAsset>({ wallet: borrowEngineWallet, tokenId: defaultTokenId })
  const [pendingDebtOrCollateral, setPendingDebtOrCollateral] = React.useState<BorrowDebt | BorrowCollateral>({
    nativeAmount: '0',
    tokenId: selectedAsset.tokenId,
    apr: 0
  })

  const [bankAccountsMap] = useAsyncValue<PaymentMethodsMap>(async (): Promise<PaymentMethodsMap> => {
    return {}
  }, [])

  // New debt/collateral amount
  const amountChange = loanManageType === 'loan-manage-borrow' || loanManageType === 'loan-manage-deposit' ? 'increase' : 'decrease'
  const actionAmountSign = amountChange === 'increase' ? '1' : '-1'

  // APR change
  const newInterestRateDebt = { nativeAmount: actionNativeAmount, tokenId: selectedAsset.tokenId, apr: newApr }

  // Loan Asset change
  const pendingDebts: BorrowDebt[] = isActionSideDebts
    ? debts.map(debt => (debt.tokenId === pendingDebtOrCollateral.tokenId ? (pendingDebtOrCollateral as BorrowDebt) : debt))
    : debts
  const pendingCollaterals: BorrowCollateral[] = isActionSideDebts
    ? collaterals
    : collaterals.map(collateral => (collateral.tokenId === pendingDebtOrCollateral.tokenId ? pendingDebtOrCollateral : collateral))

  // LTV exceeded checks
  const hardLtvRatio = '0.74'
  const [newLtv] = useAsyncValue<string>(
    async () =>
      await borrowEngine.calculateProjectedLtv({
        debts: pendingDebts,
        collaterals: pendingCollaterals
      }),
    [pendingCollaterals, pendingDebts]
  )
  const isLtvExceeded = newLtv != null && gt(newLtv, hardLtvRatio)

  // #endregion State

  // -----------------------------------------------------------------------------
  // #region Hooks
  // -----------------------------------------------------------------------------

  // TODO: Full max button implementation and behavior
  useAsyncEffect(async () => {
    const currentLoanAssetNativeAmount =
      manageActionData.actionSide === 'collaterals'
        ? collaterals.find(collateral => collateral.tokenId === selectedAsset.tokenId)?.nativeAmount ?? '0'
        : debts.find(debt => debt.tokenId === selectedAsset.tokenId)?.nativeAmount ?? '0'

    setPendingDebtOrCollateral({
      nativeAmount: max(add(currentLoanAssetNativeAmount, mul(actionAmountSign, actionNativeAmount)), '0'),
      tokenId: selectedAsset.tokenId,
      apr: 0
    })

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
                tokenId: hardAllowedDebtAssets[0].tokenId,
                fromTokenId: selectedAsset.customAsset != null ? hardAllowedCollateralAssets[0].tokenId : undefined
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
      setNewApr(apr)
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
          navigation.replace('loanStatus', { actionQueueId: actionProgram.programId, loanAccountId: loanAccount.id })
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
        navigation={navigation}
        headerTitle={lstrings.select_wallet}
        showCreateWallet={manageActionData.isFundDestWallet}
        createWalletId={manageActionData.isFundDestWallet ? borrowEngineWallet.id : undefined}
        showBankOptions={loanManageType === 'loan-manage-borrow'}
        excludeWalletIds={getWalletPickerExcludeWalletIds(wallets, loanManageType, borrowEngineWallet)}
        allowedAssets={isActionSideDebts ? hardAllowedDebtAssets : hardAllowedCollateralAssets}
        customAssets={
          // For repay, allow selection of a deposited collateral asset if there
          // are no other collateral asset balances
          loanManageType === 'loan-manage-repay' &&
          collaterals.find(collateral => collateral.tokenId !== hardCollateralTokenId && !zeroString(collateral.nativeAmount)) == null
            ? [
                {
                  wallet: borrowEngineWallet,
                  nativeBalance: collaterals.find(collateral => collateral.tokenId === hardCollateralTokenId)?.nativeAmount ?? '0',
                  referenceTokenId: hardCollateralTokenId ?? '',
                  displayName: sprintf(lstrings.loan_deposited_collateral_s, 'WBTC'),
                  currencyCode: 'WBTC'
                }
              ]
            : undefined
        }
        filterActivation
      />
    ))
      .then(async ({ walletId, currencyCode, isBankSignupRequest, fiatAccountId: wyreAccountId, customAsset }) => {
        if (isBankSignupRequest) {
          // Open bank plugin for new user signup
          navigation.navigate('pluginView', {
            plugin: guiPlugins.wyre,
            deepPath: '',
            deepQuery: {}
          })
        } else if (customAsset != null) {
          setSelectedAsset({ wallet: borrowEngineWallet, tokenId: hardAllowedDebtAssets[0].tokenId, customAsset: customAsset })
        } else if (wyreAccountId != null) {
          const paymentMethod = bankAccountsMap[wyreAccountId]
          // Set a hard-coded intermediate AAVE loan destination asset (USDC) to
          // use for the bank sell step that comes after the initial loan
          setSelectedAsset({ wallet: borrowEngineWallet, tokenId: hardDebtTokenId, paymentMethod })
        } else if (walletId != null && currencyCode != null) {
          const selectedWallet = wallets[walletId]
          const tokenId = getTokenId(account, selectedWallet.currencyInfo.pluginId, currencyCode)
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
      <Space vertical={1} around={0.5}>
        <FiatAmountInputCard
          wallet={borrowEngineWallet}
          iconUri={iconUri}
          inputModalMessage={sprintf(lstrings.loan_loan_amount_input_message_s, toPercentString(borrowPlugin.borrowInfo.maxLtvRatio.toString()))}
          title={sprintf(lstrings.loan_enter_s_amount_s, manageActionData.amountCard, fiatCurrencyCode)}
          tokenId={selectedAsset.tokenId}
          onAmountChanged={handleFiatAmountChanged}
        />
        {isShowAprChange ? <AprCard apr={newApr} key="apr" /> : null}
        <EdgeText style={styles.textTitle}>{manageActionData.srcDestCard}</EdgeText>
        <Space around={0.5}>
          <Shimmer isShown={bankAccountsMap == null} />
          <Peek isShown={bankAccountsMap != null}>
            <TappableAccountCard emptyLabel={lstrings.loan_select_receiving_wallet} selectedAsset={selectedAsset} onPress={handleShowWalletPickerModal} />
          </Peek>
        </Space>
      </Space>
      <Space vertical={1} around={0.25}>
        <TotalDebtCollateralTile
          title={isActionSideDebts ? lstrings.loan_current_principal : lstrings.loan_current_collateral}
          wallet={borrowEngineWallet}
          debtsOrCollaterals={isActionSideDebts ? debts : collaterals}
          key="currentAmount"
        />
        <TotalDebtCollateralTile
          title={isActionSideDebts ? lstrings.loan_new_principal : lstrings.loan_new_collateral}
          wallet={borrowEngineWallet}
          debtsOrCollaterals={isActionSideDebts ? pendingDebts : pendingCollaterals}
          key="newAmount"
        />
        <TotalDebtCollateralTile
          title={isActionSideDebts ? lstrings.loan_collateral_value : lstrings.loan_principal_value}
          wallet={borrowEngineWallet}
          debtsOrCollaterals={isActionSideDebts ? collaterals : debts}
          key="counterAsset"
        />
        <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={networkFeeMap[borrowEngineWallet.currencyInfo.currencyCode]?.nativeAmount ?? '0'} key="fee" />
        {isShowAprChange ? <InterestRateChangeTile borrowEngine={borrowEngine} newDebt={newInterestRateDebt} key="interestRate" /> : null}
        <LtvRatioTile borrowEngine={borrowEngine} futureValue={newLtv ?? '0'} key="ltv" />
        {isLtvExceeded && (
          <Alert
            numberOfLines={0}
            marginRem={[1.5, 0.5, -0.75, 0.5]}
            title={lstrings.exchange_insufficient_funds_title}
            message={sprintf(lstrings.loan_amount_exceeds_s_collateral, toPercentString(hardLtvRatio))}
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
