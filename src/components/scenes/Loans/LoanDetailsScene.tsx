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
  const actionQueueMap = useSelector(state => state.actionQueue.queue)
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { route, navigation } = props
  const { params } = route
  const { loanAccountId } = params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  // Derive state from borrowEngine:
  const { currencyWallet: wallet } = borrowEngine

  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
  const loanToValue = useWatch(borrowEngine, 'loanToValue')

  const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')
  // Calculate fiat totals
  const collateralTotal = useFiatTotal(wallet, collaterals)

  const debtTotal = useFiatTotal(wallet, debts)
  const availableEquity = sub(collateralTotal, debtTotal)

  // Running action program display
  const runningProgramEdge = loanAccount.programEdges.find(programEdge => {
    const actionQueueItem = actionQueueMap[programEdge.programId]
    // @ts-expect-error
    return actionQueueItem != null && actionQueueItem.state.effect != null && actionQueueItem.state.effect !== 'done'
  })
  const runningActionQueueItem = runningProgramEdge != null ? actionQueueMap[runningProgramEdge.programId] : null
  const [runningProgramMessage, setRunningProgramMessage] = React.useState<string | undefined>(undefined)

  // @ts-expect-error
  useAsyncEffect(async () => {
    if (runningActionQueueItem != null) {
      const displayInfo: ActionDisplayInfo = await getActionProgramDisplayInfo(account, runningActionQueueItem.program, runningActionQueueItem.state)
      const activeStep = displayInfo.steps.find(step => step.status === 'active')
      setRunningProgramMessage(activeStep != null ? activeStep.title : undefined)
    } else {
      setRunningProgramMessage(undefined)
    }
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
    navigation.navigate('loanAddCollateralScene', { loanAccountId })
  }
  const handleWithdrawCollateralPress = () => {
    navigation.navigate('loanWithdrawCollateralScene', { loanAccountId })
  }
  const handleLoanClosePress = () => {
    navigation.navigate('loanClose', { loanAccountId })
  }
  const handleBorrowMorePress = () => {
    navigation.navigate('loanBorrowMoreScene', { loanAccountId })
  }
  const handleRepayPress = () => {
    navigation.navigate('loanRepayScene', { loanAccountId })
  }

  const handleProgramStatusCardPress = (programEdge: LoanProgramEdge) => {
    // Go to LoanDetailsStatusScene or LoanCreateStatusScene, depending on the action program
    const statusScene = programEdge.programType === 'loan-create' ? 'loanCreateStatus' : 'loanDetailsStatus'
    navigation.navigate(statusScene, { actionQueueId: programEdge.programId })
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
                <Space sideways>
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
          </Space>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleAddCollateralPress}>
            <Space right>
              <Fontello name="add-collateral" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_action_add_collateral}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleWithdrawCollateralPress}>
            <Space right>
              <Fontello name="withdraw-collateral" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_action_withdraw_collateral}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleBorrowMorePress}>
            <Space right>
              <Fontello name="borrow-more" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_borrow_more}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleRepayPress}>
            <Space right>
              <Fontello name="make-payment" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_make_payment}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]} onPress={handleLoanClosePress}>
            <Space right>
              <Fontello name="close-loan" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_action_close_loan}</EdgeText>
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
