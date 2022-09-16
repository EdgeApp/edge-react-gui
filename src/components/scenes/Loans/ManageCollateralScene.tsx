import { mul } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { useRunningActionQueueId } from '../../../controllers/action-queue/ActionQueueStore'
import { ActionOp } from '../../../controllers/action-queue/types'
import { runLoanActionProgram } from '../../../controllers/loan-manager/redux/actions'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useState } from '../../../types/reactHooks'
import { useDispatch } from '../../../types/reactRedux'
import { NavigationProp, ParamList } from '../../../types/routerTypes'
import { getBorrowPluginIconUri } from '../../../util/CdnUris'
import { zeroString } from '../../../util/utils'
import { FiatAmountInputCard } from '../../cards/FiatAmountInputCard'
import { showError } from '../../services/AirshipInstance'
import { AprCard } from '../../tiles/AprCard'
import { InterestRateChangeTile } from '../../tiles/InterestRateChangeTile'
import { LtvRatioTile } from '../../tiles/LtvRatioTile'
import { NetworkFeeTile } from '../../tiles/NetworkFeeTile'
import { TotalDebtCollateralTile } from '../../tiles/TotalDebtCollateralTile'
import { FormScene } from '../FormScene'

type ManageCollateralRequest =
  | {
      tokenId?: string
      fromWallet: EdgeCurrencyWallet
      nativeAmount: string
    }
  | {
      tokenId?: string
      toWallet: EdgeCurrencyWallet
      nativeAmount: string
    }

type Props<T extends keyof ParamList> = {
  // TODO: Remove use of ApprovableAction to calculate fees. Update ActionQueue to handle fee calcs
  action: (request: ManageCollateralRequest) => Promise<ApprovableAction>
  actionOperand: 'debts' | 'collaterals'
  actionOpType: 'loan-borrow' | 'loan-deposit' | 'loan-repay' | 'loan-withdraw'
  actionWallet: 'fromWallet' | 'toWallet'
  amountChange?: 'increase' | 'decrease'
  loanAccount: LoanAccount

  showAprChange?: boolean

  headerText: string
  navigation: NavigationProp<T>
}

export const ManageCollateralScene = <T extends keyof ParamList>(props: Props<T>) => {
  // #region Constants

  const { action, actionOperand, actionOpType, actionWallet, amountChange = 'increase', loanAccount, showAprChange = false, headerText, navigation } = props
  const { borrowEngine, borrowPlugin } = loanAccount
  const { currencyWallet: borrowEngineWallet } = loanAccount.borrowEngine
  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
  const dispatch = useDispatch()

  // Selected debt/collateral
  const isDebt = actionOperand === 'debts'
  const defaultTokenId = isDebt ? debts[0].tokenId : collaterals[0].tokenId
  const selectedTokenId = defaultTokenId // TODO: Handle token selection after adding selection controls

  // Amount card
  const iconUri = getBorrowPluginIconUri(borrowPlugin.borrowInfo)
  const { fiatCurrencyCode: isoFiatCurrencyCode } = borrowEngineWallet
  const fiatCurrencyCode = isoFiatCurrencyCode.replace('iso:', '')

  // #endregion Constants

  // Skip directly to LoanStatusScene if an action for the same actionOpType is already being processed
  const existingProgramId = useRunningActionQueueId(actionOpType, borrowEngineWallet.id)
  if (existingProgramId != null) navigation.navigate('loanDetailsStatus', { actionQueueId: existingProgramId })

  // #region State

  const [approvalAction, setApprovalAction] = useState<ApprovableAction | null>(null)
  const [actionNativeCryptoAmount, setActionNativeCryptoAmount] = useState('0')
  const [newDebtApr, setNewDebtApr] = useState(0)
  // @ts-expect-error
  const [actionOp, setActionOp] = useState<ActionOp | undefined>()

  // #endregion

  // #region Hooks

  // @ts-expect-error
  useAsyncEffect(async () => {
    const actionOp = {
      type: 'seq',
      actions: [
        // TODO: Update typing so Flow doesn't complain

        {
          type: actionOpType,
          borrowPluginId: borrowPlugin.borrowInfo.borrowPluginId,
          nativeAmount: actionNativeCryptoAmount,
          walletId: borrowEngineWallet.id,
          tokenId: selectedTokenId
        }
      ]
    }
    // @ts-expect-error
    setActionOp(actionOp)
  }, [actionNativeCryptoAmount, borrowEngineWallet, selectedTokenId])

  // @ts-expect-error
  useAsyncEffect(async () => {
    if (zeroString(actionNativeCryptoAmount)) {
      setApprovalAction(null)
      return
    }

    const request = {
      nativeAmount: actionNativeCryptoAmount,
      [actionWallet]: borrowEngineWallet,
      tokenId: selectedTokenId
    }

    // @ts-expect-error
    const approvalAction = await action(request)
    setApprovalAction(approvalAction)

    if (showAprChange) {
      const apr = await borrowEngine.getAprQuote(selectedTokenId)
      setNewDebtApr(apr)
    }
  }, [actionNativeCryptoAmount])

  // #endregion Hooks

  // #region Handlers

  const handleFiatAmountChanged = useHandler(({ fiatAmount, nativeCryptoAmount }) => {
    setActionNativeCryptoAmount(nativeCryptoAmount)
  })

  const handleSliderComplete = useHandler(async (resetSlider: () => void) => {
    if (actionOp != null) {
      const actionProgram = await makeActionProgram(actionOp)
      try {
        await dispatch(runLoanActionProgram(loanAccount, actionProgram, actionOpType))
        navigation.navigate('loanDetailsStatus', { actionQueueId: actionProgram.programId })
      } catch (e: any) {
        showError(e)
      } finally {
        resetSlider()
      }
    }
  })

  // #endregion Handlers

  // #region Dependent Constants

  // Text input modal
  const opTypeStringMap = {
    'loan-borrow': s.strings.loan_fragment_loan,
    'loan-deposit': s.strings.loan_fragment_deposit,
    'loan-repay': s.strings.loan_fragment_repay,
    'loan-withdraw': s.strings.loan_fragment_withdraw
  }

  // New debt/collateral amount
  const actionAmountChange = amountChange === 'increase' ? '1' : '-1'
  const pendingDebtOrCollateral = { nativeAmount: mul(actionNativeCryptoAmount, actionAmountChange), tokenId: selectedTokenId, apr: 0 }

  // Fees
  const feeNativeAmount = approvalAction != null ? approvalAction.networkFee.nativeAmount : '0'

  // APR change
  const newDebt = { nativeAmount: actionNativeCryptoAmount, tokenId: selectedTokenId, apr: newDebtApr }

  // #endregion Dependent Constants

  return (
    <FormScene headerText={headerText} onSliderComplete={handleSliderComplete} sliderDisabled={approvalAction == null}>
      <FiatAmountInputCard
        wallet={borrowEngineWallet}
        iconUri={iconUri}
        inputModalMessage={sprintf(s.strings.loan_must_be_s_or_less)}
        inputModalTitle={sprintf(s.strings.loan_enter_s_amount_s, opTypeStringMap[actionOpType], fiatCurrencyCode)}
        tokenId={selectedTokenId}
        onAmountChanged={handleFiatAmountChanged}
      />
      {showAprChange ? <AprCard apr={newDebtApr} key="apr" /> : null}
      <TotalDebtCollateralTile
        title={isDebt ? s.strings.loan_current_principal : s.strings.loan_current_collateral}
        wallet={borrowEngineWallet}
        debtsOrCollaterals={isDebt ? debts : collaterals}
        key="currentAmount"
      />
      <TotalDebtCollateralTile
        title={isDebt ? s.strings.loan_new_principal : s.strings.loan_new_collateral}
        wallet={borrowEngineWallet}
        debtsOrCollaterals={isDebt ? [...debts, pendingDebtOrCollateral] : [...collaterals, pendingDebtOrCollateral]}
        key="newAmount"
      />
      <TotalDebtCollateralTile
        title={isDebt ? s.strings.loan_collateral_value : s.strings.loan_principal_value}
        wallet={borrowEngineWallet}
        debtsOrCollaterals={isDebt ? collaterals : debts}
        key="counterAsset"
      />
      <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={feeNativeAmount} key="fee" />
      {showAprChange ? <InterestRateChangeTile borrowEngine={borrowEngine} newDebt={newDebt} key="interestRate" /> : null}
      <LtvRatioTile
        borrowEngine={borrowEngine}
        tokenId={selectedTokenId}
        nativeAmount={actionNativeCryptoAmount}
        type={actionOperand}
        direction={amountChange}
        key="ltv"
      />
    </FormScene>
  )
}
