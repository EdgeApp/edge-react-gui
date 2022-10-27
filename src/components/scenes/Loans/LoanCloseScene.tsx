import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { makeActionProgram } from '../../../controllers/action-queue/ActionProgram'
import { dryrunActionProgram } from '../../../controllers/action-queue/runtime/dryrunActionProgram'
import { makeInitialProgramState } from '../../../controllers/action-queue/util/makeInitialProgramState'
import { runLoanActionProgram, saveLoanAccount } from '../../../controllers/loan-manager/redux/actions'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useExecutionContext } from '../../../hooks/useExecutionContext'
import { useHandler } from '../../../hooks/useHandler'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { makeAaveCloseAction } from '../../../util/ActionProgramUtils'
import { getExecutionNetworkFees } from '../../../util/networkFeeUtils'
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

export interface Props {
  route: RouteProp<'loanClose'>
  navigation: NavigationProp<'loanClose'>
}

export const LoanCloseScene = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const dispatch = useDispatch()

  const clientId = useSelector(state => state.core.context.clientId)
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const executionContext = useExecutionContext()

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

  const isLoanCloseSupported = collaterals.length <= 1 && debts.length <= 1

  // Derived State:

  // Create Action Ops
  const [actionProgram, actionProgramError] = useAsyncValue(async () => {
    const actionOp = await makeAaveCloseAction({
      borrowPluginId,
      borrowEngine
    })

    if (actionOp == null) return null

    const actionProgram = await makeActionProgram(actionOp)

    return actionProgram
  }, [borrowEngine, borrowEngineWallet, borrowPluginId, collateral, collateralTokenId, debt, debtTokenId])

  const [networkFeeMap, networkFeeMapError] = useAsyncValue(async () => {
    if (actionProgram === undefined) return
    if (actionProgram === null) return null
    const executionOutputs = await dryrunActionProgram(executionContext, actionProgram, makeInitialProgramState(clientId, actionProgram.programId), false)
    const networkFeeMap = getExecutionNetworkFees(executionOutputs)
    return networkFeeMap
  }, [actionProgram])

  const aggregateErrorMessage = filterNull([actionProgramError, networkFeeMapError].map(err => (err != null ? translateError(err.message) : null)))

  const isActionProgramLoading = actionProgram === undefined || networkFeeMap === undefined

  // TODO: Pass networkFeeMap to a component which can display fee total for NetworkFeeMap interfaces
  const networkFeeAggregate = (networkFeeMap ?? {})[borrowEngineWallet.currencyInfo.currencyCode]
  const networkFeeAmountAggregate = networkFeeAggregate != null ? networkFeeAggregate.nativeAmount : '0'

  // Handlers:
  const handleSliderComplete = useHandler(async (reset: () => void) => {
    // Still loading action program
    if (actionProgram === undefined) return

    // Always update the loan program marking it as close
    await dispatch(saveLoanAccount({ ...loanAccount, closed: true }))

    // No action program necessary to close loan
    if (actionProgram !== null) {
      await dispatch(runLoanActionProgram(loanAccount, actionProgram, 'loan-close'))
      navigation.navigate('loanStatus', { actionQueueId: actionProgram.programId })
    } else {
      navigation.popToTop()
    }
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
        <NetworkFeeTile wallet={borrowEngineWallet} nativeAmount={networkFeeAmountAggregate} />
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
        {!isLoanCloseSupported ? (
          <Alert title={s.strings.send_scene_error_title} message={s.strings.loan_close_loan_error} type="error" numberOfLines={7} marginRem={[1, 1, 0]} />
        ) : actionProgram !== null ? (
          <Alert title={s.strings.loan_close_loan_title} message={s.strings.loan_close_loan_warning} type="warning" numberOfLines={7} marginRem={[1, 1, 0]} />
        ) : (
          <Alert
            title={s.strings.loan_close_loan_title}
            message={s.strings.loan_close_loan_no_tx_needed_message}
            type="warning"
            numberOfLines={7}
            marginRem={[1, 1, 0]}
          />
        )}
        {aggregateErrorMessage.length > 0 ? (
          <Alert
            title={s.strings.loan_error_title}
            message={translateError(aggregateErrorMessage.concat('\n\n'))}
            type="error"
            numberOfLines={7}
            marginRem={[1, 1, 0]}
          />
        ) : null}

        <Space top bottom={2}>
          <SafeSlider onSlidingComplete={handleSliderComplete} disabled={isActionProgramLoading} />
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
