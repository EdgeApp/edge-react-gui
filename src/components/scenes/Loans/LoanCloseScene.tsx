import { add } from 'biggystring'
import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { ActionOp } from '../../../controllers/action-queue/types'
import { runLoanActionProgram } from '../../../controllers/loan-manager/redux/actions'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { MAX_AMOUNT } from '../../../plugins/borrow-plugins/plugins/aave/BorrowEngineFactory'
import { ApprovableAction } from '../../../plugins/borrow-plugins/types'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { makeAaveCloseAction } from '../../../util/ActionProgramUtils'
import { filterNull } from '../../../util/safeFilters'
import { translateError } from '../../../util/translateError'
import { zeroString } from '../../../util/utils'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { Space } from '../../layout/Space'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { SafeSlider } from '../../themed/SafeSlider'
import { SceneHeader } from '../../themed/SceneHeader'
import { NetworkFeeTile } from '../../tiles/NetworkFeeTile'
import { Tile } from '../../tiles/Tile'
import { TotalDebtCollateralTile } from '../../tiles/TotalDebtCollateralTile'

export type Props = {
  route: RouteProp<'loanClose'>
  navigation: NavigationProp<'loanClose'>
}

export const LoanCloseScene = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowPlugin, borrowEngine } = loanAccount
  const borrowPluginId = borrowPlugin.borrowInfo.borrowPluginId
  const { currencyWallet: borrowEngineWallet } = borrowEngine

  const borrowEngineCollaterals = useWatch(borrowEngine, 'collaterals')
  const collaterals = React.useMemo(() => borrowEngineCollaterals.filter(collateral => !zeroString(collateral.nativeAmount)), [borrowEngineCollaterals])
  const collateral = collaterals[0]
  const collateralTokenId = collateral?.tokenId

  const borrowEngineDebts = useWatch(borrowEngine, 'debts')
  const debts = React.useMemo(() => borrowEngineDebts.filter(debt => !zeroString(debt.nativeAmount)), [borrowEngineDebts])
  const debt = debts[0]
  const debtTokenId = debt?.tokenId

  const isRepayWithCollateralSupported = collaterals.length === 1 && debts.length === 1
  const isWithdrawOnly = collaterals.length > 0 && debts.length === 0

  // Derived State:

  // Approval actions validity checks
  const [repayApprovalAction, repayApprovalActionError] = useAsyncValue<ApprovableAction | null>(async () => {
    if (collateralTokenId == null || debtTokenId == null) return null
    return await borrowEngine.repay({ nativeAmount: MAX_AMOUNT.toString(), tokenId: debtTokenId, fromTokenId: collateralTokenId })
  }, [borrowEngine, debtTokenId, collateralTokenId])

  const [withdrawApprovalAction, withdrawApprovalActionError] = useAsyncValue<ApprovableAction | null>(async () => {
    if (isWithdrawOnly) {
      // TODO
    } else if (collateralTokenId != null) {
      return await borrowEngine.withdraw({ tokenId: collateralTokenId, nativeAmount: collateral?.nativeAmount })
    }

    return Promise.resolve(null)
  }, [borrowEngine, debtTokenId])

  const isApprovableActionValid = repayApprovalAction != null && withdrawApprovalAction != null

  const approvalErrors = filterNull([repayApprovalActionError, withdrawApprovalActionError].map(err => (err != null ? translateError(err.message) : null)))

  // Create Action Ops
  const [actionOps, setActionOps] = React.useState<ActionOp | null>(null)
  useAsyncEffect(async () => {
    if (collateral != null && collateralTokenId != null && debtTokenId != null) {
      setActionOps({
        type: 'seq',
        actions: await makeAaveCloseAction({
          borrowPluginId,
          collateralTokenId,
          debtTokenId,
          wallet: borrowEngineWallet
        })
      })
    } else {
      setActionOps(null)
    }

    return () => {}
  }, [borrowEngine, borrowEngineWallet, borrowPluginId, collateral, collateralTokenId, debt, debtTokenId])

  const networkFee = !isApprovableActionValid ? '0' : add(repayApprovalAction.networkFee.nativeAmount, withdrawApprovalAction.networkFee.nativeAmount)

  // Handlers:
  const handleSliderComplete = useHandler(async (reset: () => void) => {
    if (actionOps == null) return
    const actionProgram = await makeActionProgram(actionOps)
    await dispatch(runLoanActionProgram(loanAccount, actionProgram, 'loan-close'))
    navigation.navigate('loanStatus', { actionQueueId: actionProgram.programId })
  })

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_close_loan_title} style={styles.sceneHeader}>
        <Space right>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </Space>
      </SceneHeader>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <TotalDebtCollateralTile title={s.strings.loan_remaining_principal} wallet={borrowEngineWallet} debtsOrCollaterals={debts} />
        <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={networkFee} />
        {debts.length > 0 ? (
          <Tile title={s.strings.loan_remaining_principal} type="static">
            {debts.map(debt => (
              <Space key={debt.tokenId} vertical={0.5}>
                <CryptoFiatAmountRow nativeAmount={debt.nativeAmount} tokenId={debt.tokenId} wallet={borrowEngineWallet} />
              </Space>
            ))}
          </Tile>
        ) : null}
        {collaterals.length > 0 ? (
          <Tile title={s.strings.loan_collateral_amount} type="static">
            {collaterals.map(collateral => (
              <Space key={collateral.tokenId} vertical={0.5}>
                <CryptoFiatAmountRow nativeAmount={collateral.nativeAmount} tokenId={collateral.tokenId} wallet={borrowEngineWallet} />
              </Space>
            ))}
          </Tile>
        ) : null}
        {!isWithdrawOnly ? (
          !isRepayWithCollateralSupported ? (
            <Alert title={s.strings.send_scene_error_title} message={s.strings.loan_close_loan_error} type="error" numberOfLines={7} marginRem={[1, 1, 0]} />
          ) : (
            <Alert title={s.strings.loan_close_loan_title} message={s.strings.loan_close_loan_warning} type="warning" numberOfLines={7} marginRem={[1, 1, 0]} />
          )
        ) : null}
        {approvalErrors.length > 0 ? (
          <Alert
            title={s.strings.loan_error_title}
            message={translateError(approvalErrors.concat('\n\n'))}
            type="error"
            numberOfLines={7}
            marginRem={[1, 1, 0]}
          />
        ) : null}

        <Space top bottom={2}>
          <SafeSlider onSlidingComplete={handleSliderComplete} disabled={!isApprovableActionValid} />
        </Space>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.rem(1)
  }
}))
