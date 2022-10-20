import { add, div, gt, max, mul, sub } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../../assets/vector'
import { getSymbolFromCurrency } from '../../../constants/WalletAndCurrencyConstants'
import { getActionProgramDisplayInfo } from '../../../controllers/action-queue/display'
import { ActionDisplayInfo } from '../../../controllers/action-queue/types'
import { checkEffectIsDone } from '../../../controllers/action-queue/util/checkEffectIsDone'
import { LoanProgramEdge } from '../../../controllers/loan-manager/store'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { GuiExchangeRates } from '../../../types/types'
import { getToken } from '../../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { LoanDetailsSummaryCard } from '../../cards/LoanDetailsSummaryCard'
import { TappableCard } from '../../cards/TappableCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FiatIcon } from '../../icons/FiatIcon'
import { Space } from '../../layout/Space'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { SectionHeading } from '../../text/SectionHeading'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  route: RouteProp<'loanDetails'>
  navigation: NavigationProp<'loanDetails'>
}

export const LoanDetailsScene = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const actionQueueMap = useSelector(state => state.actionQueue.actionQueueMap)
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { route, navigation } = props
  const { params } = route
  const { loanAccountId } = params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  // Derive state from borrowEngine:
  const { currencyWallet: wallet } = borrowEngine
  const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')

  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
  const openCollaterals = React.useMemo(() => collaterals.filter(collateral => !zeroString(collateral.nativeAmount)), [collaterals])
  const isCollateralAvailable = openCollaterals.length > 0

  const openDebts = React.useMemo(() => debts.filter(debt => !zeroString(debt.nativeAmount)), [debts])
  const isDebtAvailable = openDebts.length > 0

  const loanToValue = useWatch(borrowEngine, 'loanToValue')

  // Calculate fiat totals
  const collateralTotal = useFiatTotal(wallet, collaterals)

  const debtTotal = useFiatTotal(wallet, debts)
  const availableEquity = sub(collateralTotal, debtTotal)

  // Running action program display
  const runningProgramEdge = loanAccount.programEdges.find(programEdge => {
    const actionQueueItem = actionQueueMap[programEdge.programId]
    return actionQueueItem != null && !checkEffectIsDone(actionQueueItem.state.effect)
  })
  const runningActionQueueItem = runningProgramEdge != null ? actionQueueMap[runningProgramEdge.programId] : null
  const [runningProgramMessage, setRunningProgramMessage] = React.useState<string | undefined>(undefined)
  const isActionProgramRunning = runningProgramMessage != null

  useAsyncEffect(async () => {
    if (runningActionQueueItem != null) {
      const displayInfo: ActionDisplayInfo = await getActionProgramDisplayInfo(account, runningActionQueueItem.program, runningActionQueueItem.state)
      const activeStep = displayInfo.steps.find(step => step.status === 'active')
      setRunningProgramMessage(activeStep != null ? activeStep.title : undefined)
    } else {
      setRunningProgramMessage(undefined)
    }

    return () => {}
  }, [account, runningActionQueueItem])

  const summaryDetails = [
    { label: s.strings.loan_collateral_value, value: displayFiatTotal(wallet, collateralTotal) },
    {
      label: s.strings.loan_available_equity,
      value: displayFiatTotal(wallet, availableEquity),
      icon: <Ionicon name="information-circle-outline" size={theme.rem(1)} color={theme.iconTappable} />
    }
  ]

  const handleAddCollateralPress = () => {
    navigation.navigate('loanManage', { actionOpType: 'loan-deposit', loanAccountId })
  }
  const handleWithdrawCollateralPress = () => {
    navigation.navigate('loanManage', { actionOpType: 'loan-withdraw', loanAccountId })
  }
  const handleBorrowMorePress = () => {
    navigation.navigate('loanManage', { actionOpType: 'loan-borrow', loanAccountId })
  }
  const handleRepayPress = () => {
    navigation.navigate('loanManage', { actionOpType: 'loan-repay', loanAccountId })
  }
  const handleLoanClosePress = () => {
    navigation.navigate('loanClose', { loanAccountId })
  }
  const handleProgramStatusCardPress = (programEdge: LoanProgramEdge) => {
    navigation.navigate('loanStatus', { actionQueueId: programEdge.programId, loanAccountId })
  }

  const renderProgramStatusCard = () => {
    if (runningProgramMessage != null && runningProgramEdge != null) {
      return (
        <TouchableOpacity onPress={() => handleProgramStatusCardPress(runningProgramEdge)}>
          <Card marginRem={[0, 0, 1]}>
            <View style={styles.programStatusContainer}>
              <ActivityIndicator color={theme.iconTappable} style={styles.activityIndicator} />
              <EdgeText>{runningProgramMessage}</EdgeText>
            </View>
          </Card>
        </TouchableOpacity>
      )
    } else return null
  }

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_details_title} style={styles.sceneHeader} />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <Space around>
          {renderProgramStatusCard()}
          <LoanDetailsSummaryCard
            currencyIcon={<FiatIcon fiatCurrencyCode={fiatCurrencyCode} />}
            currencyCode={fiatCurrencyCode}
            total={debtTotal}
            details={summaryDetails}
            ltv={loanToValue}
          />
        </Space>
        <Space horizontal>
          <Space bottom>
            <SectionHeading>{s.strings.loan_loan_breakdown_title}</SectionHeading>
          </Space>
          {debts.map(debt => {
            const token = getToken(wallet, debt.tokenId)
            const currencyCode = token?.currencyCode ?? 'N/A'
            const aprText = sprintf(s.strings.loan_apr_s, toPercentString(debt.apr))
            return (
              <Card key={debt.tokenId} marginRem={[0, 0, 1]}>
                <Space isSideways>
                  <Space right>
                    <CryptoIcon currencyCode={currencyCode} hideSecondary />
                  </Space>
                  <Space>
                    <EdgeText style={styles.breakdownText}>
                      <CryptoText wallet={wallet} tokenId={debt.tokenId} nativeAmount={debt.nativeAmount} />
                    </EdgeText>
                    <EdgeText style={styles.breakdownSubText}>{aprText}</EdgeText>
                  </Space>
                </Space>
              </Card>
            )
          })}
        </Space>

        {/* Tappable Action Cards */}
        <Space horizontal>
          <Space bottom>
            <SectionHeading>{s.strings.loan_actions_title}</SectionHeading>
            {isActionProgramRunning ? (
              <Alert type="warning" title={s.strings.warning_please_wait_title} message={s.strings.loan_action_program_running} marginRem={[0.5, 0, 0, 0]} />
            ) : null}
          </Space>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleAddCollateralPress} disabled={isActionProgramRunning}>
            <Space right>
              <Fontello name="add-collateral" size={theme.rem(2)} color={isActionProgramRunning ? theme.deactivatedText : theme.iconTappable} />
            </Space>
            <EdgeText style={isActionProgramRunning ? styles.actionLabelDisabled : styles.actionLabel}>{s.strings.loan_action_add_collateral}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleWithdrawCollateralPress} disabled={isActionProgramRunning || !isCollateralAvailable}>
            <Space right>
              <Fontello
                name="withdraw-collateral"
                size={theme.rem(2)}
                color={isActionProgramRunning || !isCollateralAvailable ? theme.deactivatedText : theme.iconTappable}
              />
            </Space>
            <EdgeText style={isActionProgramRunning || !isCollateralAvailable ? styles.actionLabelDisabled : styles.actionLabel}>
              {s.strings.loan_action_withdraw_collateral}
            </EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleBorrowMorePress} disabled={isActionProgramRunning || !isDebtAvailable}>
            <Space right>
              <Fontello
                name="borrow-more"
                size={theme.rem(2)}
                color={isActionProgramRunning || !isCollateralAvailable ? theme.deactivatedText : theme.iconTappable}
              />
            </Space>
            <EdgeText style={isActionProgramRunning || !isCollateralAvailable ? styles.actionLabelDisabled : styles.actionLabel}>
              {s.strings.loan_borrow_more}
            </EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleRepayPress} disabled={isActionProgramRunning || !isCollateralAvailable}>
            <Space right>
              <Fontello
                name="make-payment"
                size={theme.rem(2)}
                color={isActionProgramRunning || !isDebtAvailable ? theme.deactivatedText : theme.iconTappable}
              />
            </Space>
            <EdgeText style={isActionProgramRunning || !isDebtAvailable ? styles.actionLabelDisabled : styles.actionLabel}>
              {s.strings.loan_make_payment}
            </EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleLoanClosePress} disabled={isActionProgramRunning}>
            <Space right>
              <Fontello name="close-loan" size={theme.rem(2)} color={isActionProgramRunning ? theme.deactivatedText : theme.iconTappable} />
            </Space>
            <EdgeText style={isActionProgramRunning ? styles.actionLabelDisabled : styles.actionLabel}>{s.strings.loan_action_close_loan}</EdgeText>
          </TappableCard>
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
  },
  actionLabel: {
    fontFamily: theme.fontFaceMedium,
    alignSelf: 'center'
  },
  actionLabelDisabled: {
    color: theme.deactivatedText,
    fontFamily: theme.fontFaceMedium,
    alignSelf: 'center'
  },
  activityIndicator: {
    alignSelf: 'flex-start',
    marginRight: theme.rem(0.5)
  },
  breakdownText: {
    fontFamily: theme.fontFaceBold
  },
  breakdownSubText: {
    fontSize: theme.rem(0.75)
  },
  programStatusContainer: {
    flexDirection: 'row'
  }
}))

export const useFiatTotal = (wallet: EdgeCurrencyWallet, tokenAmounts: Array<{ tokenId?: string; nativeAmount: string }>): string => {
  const exchangeRates = useSelector(state => state.exchangeRates)

  return tokenAmounts.reduce((sum, tokenAmount) => {
    const fiatAmount = calculateFiatAmount(wallet, exchangeRates, tokenAmount.tokenId, tokenAmount.nativeAmount)
    return add(sum, fiatAmount)
  }, '0')
}

export const displayFiatTotal = (wallet: EdgeCurrencyWallet, fiatAmount: string) => {
  const isoFiatCurrencyCode = wallet.fiatCurrencyCode
  const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)

  return `${fiatSymbol}${formatFiatString({ autoPrecision: true, fiatAmount })}`
}

export const calculateFiatAmount = (wallet: EdgeCurrencyWallet, exchangeRates: GuiExchangeRates, tokenId: string | undefined, nativeAmount: string): string => {
  if (tokenId == null) return '0' // TODO: Support wrapped native token

  const token = getToken(wallet, tokenId)
  if (token == null) return '0'

  const { currencyCode, denominations } = token
  const key = `${currencyCode}_${wallet.fiatCurrencyCode}`
  const assetFiatPrice = exchangeRates[key] ?? '0'
  if (zeroString(assetFiatPrice)) {
    return '0'
  }

  const [denomination] = denominations
  const fiatAmount = div(mul(nativeAmount, assetFiatPrice), denomination.multiplier, DECIMAL_PRECISION)
  return gt(fiatAmount, '0') ? max('0.01', div(fiatAmount, '1', 2)) : '0'
}
