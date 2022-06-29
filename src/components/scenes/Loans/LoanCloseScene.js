// @flow

import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { useRefresher } from '../../../hooks/useRefresher'
import s from '../../../locales/strings'
import { type ApprovableAction, type BorrowEngine } from '../../../plugins/borrow-plugins/types'
import { useCallback, useState } from '../../../types/reactHooks'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { translateError } from '../../../util/translateError'
import { DebtAmountTile, NetworkFeeTile } from '../../cards/LoanDebtsAndCollateralComponents'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoFiatAmountRow } from '../../data/row/CryptoFiatAmountRow'
import { Space } from '../../layout/Space'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { Alert } from '../../themed/Alert'
import { SafeSlider } from '../../themed/SafeSlider'
import { SceneHeader } from '../../themed/SceneHeader'
import { Tile } from '../../tiles/Tile'

export type Props = {
  route: RouteProp<'loanClose'>,
  navigation: NavigationProp<'loanClose'>
}

export const LoanCloseScene = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { route, navigation } = props
  const { params } = route
  const { borrowPlugin } = params

  // Async State:
  const borrowEngineRefresher = useCallback(() => borrowPlugin.makeBorrowEngine(params.borrowEngine.currencyWallet), [borrowPlugin, params.borrowEngine])
  const borrowEngine = useRefresher<BorrowEngine>(borrowEngineRefresher, params.borrowEngine, 10000)
  const [approvableAction, setApprovableAction] = useState<ApprovableAction | null>(null)
  const [approvableActionError, setApprovableActionError] = useState<Error | null>(null)
  useAsyncEffect(async () => {
    try {
      const action = await borrowEngine.close()
      setApprovableAction(action)
    } catch (error) {
      setApprovableActionError(error)
    }
  }, [borrowEngine])

  // Derived State:
  const networkFee = approvableAction != null ? approvableAction.networkFee.nativeAmount : '0'
  const { currencyWallet: wallet, collaterals, debts } = borrowEngine

  // Handlers:
  const onSliderComplete = async (reset: () => void) => {
    if (approvableAction == null) return

    await approvableAction.approve()
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
        <DebtAmountTile title={s.strings.loan_remaining_principle} wallet={wallet} debts={debts} />
        <NetworkFeeTile wallet={wallet} nativeAmount={networkFee} />
        {/* TODO: Show a single source wallet picker */}
        <Tile title={s.strings.loan_debt_amount_title} type="static">
          {debts.map(debt => (
            <Space key={debt.tokenId} veritcal={0.5}>
              <CryptoFiatAmountRow nativeAmount={debt.nativeAmount} tokenId={debt.tokenId} wallet={wallet} />
            </Space>
          ))}
        </Tile>
        <Tile title={s.strings.loan_collateral_amount} type="static">
          {collaterals.map(collateral => (
            <Space key={collateral.tokenId} veritcal={0.5}>
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
          <Alert
            title={s.strings.loan_transaction_error_title}
            message={translateError(approvableActionError)}
            type="error"
            numberOfLines={7}
            marginRem={[1, 1, 0]}
          />
        ) : null}

        <Space top bottom={2}>
          <SafeSlider onSlidingComplete={onSliderComplete} disabled={approvableAction === null} />
        </Space>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => ({
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.rem(1)
  }
}))
