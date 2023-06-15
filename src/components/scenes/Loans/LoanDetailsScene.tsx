import { add, div, gt, max, mul, sub } from 'biggystring'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, TouchableOpacity } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { Fontello } from '../../../assets/vector'
import { AAVE_SUPPORT_ARTICLE_URL_1S } from '../../../constants/aaveConstants'
import { getSymbolFromCurrency } from '../../../constants/WalletAndCurrencyConstants'
import { getActionProgramDisplayInfo } from '../../../controllers/action-queue/display'
import { ActionDisplayInfo } from '../../../controllers/action-queue/types'
import { checkEffectIsDone } from '../../../controllers/action-queue/util/checkEffectIsDone'
import { LoanProgramEdge } from '../../../controllers/loan-manager/store'
import { LoanAccount } from '../../../controllers/loan-manager/types'
import { useAsyncEffect } from '../../../hooks/useAsyncEffect'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useUrlHandler } from '../../../hooks/useUrlHandler'
import { useWatch } from '../../../hooks/useWatch'
import { toPercentString } from '../../../locales/intl'
import { lstrings } from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { EdgeSceneProps } from '../../../types/routerTypes'
import { GuiExchangeRates } from '../../../types/types'
import { getToken } from '../../../util/CurrencyInfoHelpers'
import { DECIMAL_PRECISION, zeroString } from '../../../util/utils'
import { Card } from '../../cards/Card'
import { LoanDetailsSummaryCard } from '../../cards/LoanDetailsSummaryCard'
import { TappableCard } from '../../cards/TappableCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { withLoanAccount } from '../../hoc/withLoanAccount'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FiatIcon } from '../../icons/FiatIcon'
import { Space } from '../../layout/Space'
import { cacheStyles, Theme, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { SectionHeading } from '../../text/SectionHeading'
import { Alert } from '../../themed/Alert'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

interface Props extends EdgeSceneProps<'loanDetails'> {
  loanAccount: LoanAccount
}

export const LoanDetailsSceneComponent = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const actionQueueMap = useSelector(state => state.actionQueue.actionQueueMap)

  const { navigation, loanAccount } = props
  const loanAccountId = loanAccount.id
  const { borrowEngine } = loanAccount

  // Derive state from borrowEngine:
  const { currencyWallet: wallet } = borrowEngine
  const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')

  const collaterals = useWatch(borrowEngine, 'collaterals')
  const debts = useWatch(borrowEngine, 'debts')
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
    { label: lstrings.loan_collateral_value, value: displayFiatTotal(wallet, collateralTotal) },
    {
      label: lstrings.loan_available_equity,
      value: displayFiatTotal(wallet, availableEquity),
      icon: <Ionicon name="information-circle-outline" size={theme.rem(1)} color={theme.iconTappable} />
    }
  ]

  const handleInfoIconPress = useUrlHandler(sprintf(AAVE_SUPPORT_ARTICLE_URL_1S, 'loan-details'))

  const handleProgramStatusCardPress = (programEdge: LoanProgramEdge) => {
    navigation.navigate('loanStatus', { actionQueueId: programEdge.programId, loanAccountId })
  }

  const renderProgramStatusCard = () => {
    if (runningProgramMessage != null && runningProgramEdge != null) {
      return (
        <TouchableOpacity onPress={() => handleProgramStatusCardPress(runningProgramEdge)}>
          <Card marginRem={[0, 0, 1]}>
            <Space sideways>
              <ActivityIndicator color={theme.iconTappable} style={styles.activityIndicator} />
              <EdgeText style={styles.programStatusText} numberOfLines={2}>
                {runningProgramMessage}
              </EdgeText>
            </Space>
          </Card>
        </TouchableOpacity>
      )
    } else return null
  }

  // #region Loan Action Cards

  const collateralPositions = React.useMemo(() => collaterals.filter(collateral => !zeroString(collateral.nativeAmount)), [collaterals])
  const debtPositions = React.useMemo(() => debts.filter(debt => !zeroString(debt.nativeAmount)), [debts])

  const actionCards = React.useMemo(() => {
    const isOpenCollaterals = collateralPositions.length > 0
    const isOpenDebts = debtPositions.length > 0
    const actionCardConfigs: Array<{
      title: string
      iconName: string
      handlePress: () => void
      isDisabled: boolean
    }> = [
      {
        title: lstrings.loan_action_add_collateral,
        iconName: 'add-collateral',
        handlePress: () => {
          navigation.navigate('loanManage', { loanManageType: 'loan-manage-deposit', loanAccountId })
        },
        isDisabled: isActionProgramRunning
      },
      {
        title: lstrings.loan_action_withdraw_collateral,
        iconName: 'withdraw-collateral',
        handlePress: () => {
          navigation.navigate('loanManage', { loanManageType: 'loan-manage-withdraw', loanAccountId })
        },
        isDisabled: isActionProgramRunning || !isOpenCollaterals
      },
      {
        title: lstrings.loan_borrow_more,
        iconName: 'borrow-more',
        handlePress: () => {
          navigation.navigate('loanManage', { loanManageType: 'loan-manage-borrow', loanAccountId })
        },
        isDisabled: isActionProgramRunning || !isOpenCollaterals
      },
      {
        title: lstrings.loan_make_payment,
        iconName: 'make-payment',
        handlePress: () => {
          navigation.navigate('loanManage', { loanManageType: 'loan-manage-repay', loanAccountId })
        },
        isDisabled: isActionProgramRunning || !isOpenDebts
      },
      {
        title: lstrings.loan_action_close_loan,
        iconName: 'close-loan',
        handlePress: () => {
          navigation.navigate('loanClose', { loanAccountId })
        },
        isDisabled: isActionProgramRunning
      }
    ]

    return (
      <>
        {actionCardConfigs.map(actionCardConfigData => {
          const { title, iconName, handlePress, isDisabled } = actionCardConfigData
          return (
            <TappableCard marginRem={[0, 0, 1, 0]} onPress={handlePress} disabled={isDisabled} key={iconName}>
              <Space right={1}>
                <Fontello name={iconName} size={theme.rem(2)} color={isDisabled ? theme.deactivatedText : theme.iconTappable} />
              </Space>
              <EdgeText style={isDisabled ? styles.actionLabelDisabled : styles.actionLabel}>{title}</EdgeText>
            </TappableCard>
          )
        })}
      </>
    )
  }, [
    isActionProgramRunning,
    loanAccountId,
    navigation,
    collateralPositions.length,
    debtPositions.length,
    styles.actionLabel,
    styles.actionLabelDisabled,
    theme
  ])

  // #endregion

  const isDevMode = useSelector(state => state.ui.settings.developerModeOn)
  const { pluginId } = wallet.currencyInfo

  return (
    <SceneWrapper>
      <SceneHeader
        tertiary={
          <TouchableOpacity onPress={handleInfoIconPress}>
            <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
          </TouchableOpacity>
        }
        title={`${lstrings.loan_details_title}${isDevMode ? ` (${wallet.name})` : ''}`}
        underline
        withTopMargin
      />
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <Space around={1} top={1.5}>
          {renderProgramStatusCard()}
          <LoanDetailsSummaryCard
            currencyIcon={<FiatIcon fiatCurrencyCode={fiatCurrencyCode} />}
            currencyCode={fiatCurrencyCode}
            total={debtTotal}
            details={summaryDetails}
            ltv={loanToValue}
          />
        </Space>
        <Space horizontal={1}>
          <Space bottom={1}>
            <SectionHeading>{lstrings.loan_loan_breakdown_title}</SectionHeading>
          </Space>
          {debts.map(debt => {
            if (zeroString(debt.nativeAmount)) return null
            const aprText = sprintf(lstrings.loan_apr_s, toPercentString(debt.apr))
            return (
              <Card key={debt.tokenId} marginRem={[0, 0, 1]}>
                <Space sideways>
                  <Space right={1}>
                    <CryptoIcon hideSecondary pluginId={pluginId} tokenId={debt.tokenId} />
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
        <Space horizontal={1}>
          <Space bottom={1}>
            <SectionHeading>{lstrings.loan_actions_title}</SectionHeading>
            {isActionProgramRunning ? (
              <Alert type="warning" title={lstrings.warning_please_wait_title} message={lstrings.loan_action_program_running} marginRem={[0.5, 0, 0, 0]} />
            ) : null}
          </Space>
          {actionCards}
        </Space>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
  programStatusText: {
    flexShrink: 1
  },
  sceneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.rem(1)
  }
}))

export const LoanDetailsScene = withLoanAccount(LoanDetailsSceneComponent)

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
