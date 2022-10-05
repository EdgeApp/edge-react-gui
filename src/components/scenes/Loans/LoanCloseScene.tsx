import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { updateLoanAccount } from '../../../controllers/loan-manager/redux/actions'
import { checkLoanHasFunds } from '../../../controllers/loan-manager/util/checkLoanHasFunds'
import { useAsyncValue } from '../../../hooks/useAsyncValue'
import { useRefresher } from '../../../hooks/useRefresher'
import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { BorrowEngine } from '../../../plugins/borrow-plugins/types'
import { useDispatch, useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { translateError } from '../../../util/translateError'
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
  const { borrowPlugin, borrowEngine: initBorrowEngine } = loanAccount

  // Async State:
  // Refreshing borrowEngine TODO: refactor common method
  const borrowEngineRefresher = React.useCallback(async () => borrowPlugin.makeBorrowEngine(initBorrowEngine.currencyWallet), [borrowPlugin, initBorrowEngine])
  const borrowEngine = useRefresher<BorrowEngine>(borrowEngineRefresher, initBorrowEngine, 10000)
  const [approvableAction, approvableActionError] = useAsyncValue(async () => borrowEngine.close(), [borrowEngine])

  // Derived State:
  const networkFee = approvableAction != null ? approvableAction.networkFee.nativeAmount : '0'
  const { currencyWallet: wallet } = borrowEngine

  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')

  // Handlers:
  const onSliderComplete = async (reset: () => void) => {
    if (approvableAction == null) return

    if (checkLoanHasFunds(borrowEngine)) {
      await approvableAction.approve()
    }

    await dispatch(updateLoanAccount({ ...loanAccount, closed: true }))
    navigation.popToTop()
  }

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_close_loan_title} style={styles.sceneHeader}>
        <Space right>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </Space>
      </SceneHeader>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <TotalDebtCollateralTile title={s.strings.loan_remaining_principal} wallet={wallet} debtsOrCollaterals={debts} />
        <NetworkFeeTile wallet={wallet} nativeAmount={networkFee} />
        {/* TODO: Show a single source wallet picker */}
        <Tile title={s.strings.loan_remaining_principal} type="static">
          {debts.map(debt => (
            <Space key={debt.tokenId} vertical={0.5}>
              <CryptoFiatAmountRow nativeAmount={debt.nativeAmount} tokenId={debt.tokenId} wallet={wallet} />
            </Space>
          ))}
        </Tile>
        <Tile title={s.strings.loan_collateral_amount} type="static">
          {collaterals.map(collateral => (
            <Space key={collateral.tokenId} vertical={0.5}>
              <CryptoFiatAmountRow nativeAmount={collateral.nativeAmount} tokenId={collateral.tokenId} wallet={wallet} />
            </Space>
          ))}
        </Tile>
        {/* TODO: Show a single destination wallet picker */}
        {/* Hide destination wallet picker because we can get away using the loan account wallet as the source and destination */}
        {/* <Tile title={s.strings.loan_collateral_destination} type="static">
          {collaterals.map(collateral => (
            <TappableRow veritcal={0.5} key={collateral.tokenId}>
              <CurrencyRow wallet={wallet} tokenId={collateral.tokenId} />
            </TappableRow>
          ))}
        </Tile> */}
        <Alert title={s.strings.loan_close_loan_title} message={s.strings.loan_close_loan_message} type="warning" numberOfLines={7} marginRem={[1, 1, 0]} />
        {approvableActionError != null ? (
          <Alert title={s.strings.loan_error_title} message={translateError(approvableActionError)} type="error" numberOfLines={7} marginRem={[1, 1, 0]} />
        ) : null}

        <Space top bottom={2}>
          <SafeSlider onSlidingComplete={onSliderComplete} disabled={approvableAction === null} />
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
