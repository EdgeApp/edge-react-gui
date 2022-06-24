// @flow

import { add, div, gt, max, mul, sub } from 'biggystring'
import { type EdgeCurrencyWallet, type EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../../assets/vector'
import { getSymbolFromCurrency } from '../../../constants/WalletAndCurrencyConstants'
import { formatFiatString } from '../../../hooks/useFiatText'
import { useRefresher } from '../../../hooks/useRefresher'
import s from '../../../locales/strings'
import { type BorrowEngine } from '../../../plugins/borrow-plugins/types'
import { useCallback } from '../../../types/reactHooks'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { type GuiExchangeRates } from '../../../types/types'
import { DECIMAL_PRECISION, zeroString } from '../../../util/utils'
import { LoanDetailsSummaryCard } from '../../cards/LoanDetailsSummaryCard'
import { TappableCard } from '../../cards/TappableCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FiatIcon } from '../../icons/FiatIcon'
import { Space } from '../../layout/Space'
import { showError } from '../../services/AirshipInstance'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { CryptoText } from '../../text/CryptoText'
import { SectionHeading } from '../../text/SectionHeading'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  route: RouteProp<'loanDetails'>,
  navigation: NavigationProp<'loanDetails'>
}

export const LoanDetailsScene = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { route, navigation } = props
  const { params } = route
  const { borrowPlugin } = params

  // Refreshing borrowEngine
  const borrowEngineRefresher = useCallback(() => borrowPlugin.makeBorrowEngine(params.borrowEngine.currencyWallet), [borrowPlugin, params.borrowEngine])
  const borrowEngine = useRefresher<BorrowEngine>(borrowEngineRefresher, params.borrowEngine, 10000)

  // Derive state from borrowEngine:
  const { collaterals, debts, currencyWallet: wallet, loanToValue } = borrowEngine
  const fiatCurrencyCode = wallet.fiatCurrencyCode.replace('iso:', '')
  // Calculate fiat totals
  const collateralTotal = useFiatTotal(wallet, collaterals)
  // $FlowFixMe
  const debtTotal = useFiatTotal(wallet, debts)
  const availableEquity = sub(collateralTotal, debtTotal)

  const summaryDetails = [
    { label: s.strings.loan_collateral_value, value: displayFiatTotal(wallet, collateralTotal) },
    {
      label: s.strings.loan_available_equity,
      value: availableEquity,
      icon: <Ionicon name="information-circle-outline" size={theme.rem(1)} color={theme.iconTappable} />
    }
  ]

  const handleBreakdownPress = (tokenId?: string) => {
    if (tokenId == null) {
      showError(`Unwrapped native currency not yet supported`)
      return
    }

    navigation.navigate('loanBorrowDetails', { borrowEngine, borrowPlugin, tokenId })
  }

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_details_title} style={styles.sceneHeader}>
        <Space right>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </Space>
      </SceneHeader>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <Space around>
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
            const aprText = `APR: ${(debt.apr * 100).toFixed(0)}%`
            return (
              <TappableCard key={debt.tokenId} marginRem={[0, 0, 1]} onPress={() => handleBreakdownPress(debt.tokenId)}>
                <Space right>
                  <CryptoIcon currencyCode={currencyCode} hideSecondary />
                </Space>
                <Space>
                  <EdgeText style={styles.breakdownText}>
                    <CryptoText wallet={wallet} tokenId={debt.tokenId} nativeAmount={debt.nativeAmount} />
                  </EdgeText>
                  <EdgeText style={styles.breakdownSubText}>{aprText}</EdgeText>
                </Space>
              </TappableCard>
            )
          })}
        </Space>
        <Space horizontal>
          <Space bottom>
            <SectionHeading>{s.strings.loan_actions_title}</SectionHeading>
          </Space>
          <TappableCard marginRem={[0, 0, 1, 0]}>
            <Space right style={styles.actionIcon}>
              <Fontello name="add-collateral" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_action_add_collateral}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]}>
            <Space right style={styles.actionIcon}>
              <Fontello name="withdraw-collateral" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_action_withdraw_collateral}</EdgeText>
          </TappableCard>
          <TappableCard marginRem={[0, 0, 1, 0]}>
            <Space right style={styles.actionIcon}>
              <Fontello name="close-loan" size={theme.rem(2)} color={theme.iconTappable} />
            </Space>
            <EdgeText style={styles.actionLabel}>{s.strings.loan_action_close_loan}</EdgeText>
          </TappableCard>
        </Space>
      </KeyboardAwareScrollView>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles(theme => {
  return {
    sceneHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.rem(1)
    },

    actionIcon: {
      marginTop: theme.rem(-0.25),
      marginLeft: theme.rem(-0.25),
      marginBottom: theme.rem(-0.25)
    },
    actionLabel: {
      fontFamily: theme.fontFaceMedium
    },

    breakdownText: {
      fontFamily: theme.fontFaceBold
    },
    breakdownSubText: {
      fontSize: theme.rem(0.75)
    }
  }
})

export const useFiatTotal = (wallet: EdgeCurrencyWallet, tokenAmounts: Array<{ tokenId?: string, nativeAmount: string }>): string => {
  const exchangeRates = useSelector(state => state.exchangeRates)

  return tokenAmounts.reduce((sum, tokenAmount) => {
    const fiatAmount = calculateFiatAmount(wallet, exchangeRates, tokenAmount.tokenId, tokenAmount.nativeAmount)
    return add(sum, fiatAmount)
  }, '0')
}

export const displayFiatTotal = (wallet: EdgeCurrencyWallet, fiatAmount: string) => {
  const isoFiatCurrencyCode = wallet.fiatCurrencyCode
  const fiatSymbol = getSymbolFromCurrency(isoFiatCurrencyCode)

  return `${fiatSymbol}${formatFiatString({ autoPrecision: true, fiatAmount, noGrouping: true })}`
}

export const calculateFiatAmount = (wallet: EdgeCurrencyWallet, exchangeRates: GuiExchangeRates, tokenId: string | void, nativeAmount: string): string => {
  if (tokenId == null) return '0' // TODO: Support wrapped native token

  const token = getToken(wallet, tokenId)
  if (token == null) return '0'

  const { currencyCode, denominations } = token
  const key = `${currencyCode}_${wallet.fiatCurrencyCode}`
  const assetFiatPrice = exchangeRates[key] ?? '0'
  if (zeroString(assetFiatPrice)) {
    showError(`No exchange rate for ${key}`)
    return '0'
  }

  const [denomination] = denominations
  const fiatAmount = div(mul(nativeAmount, assetFiatPrice), denomination.multiplier, DECIMAL_PRECISION)
  return gt(fiatAmount, '0') ? max('0.01', div(fiatAmount, '1', 2)) : '0'
}

export const getToken = (wallet: EdgeCurrencyWallet, tokenId?: string): EdgeToken | void => {
  if (tokenId == null) {
    showError(`Unwrapped native currency not yet supported`)
    return // TODO: Support wrapped native token
  }
  const allTokens = wallet.currencyConfig.allTokens
  if (!Object.keys(allTokens).some(tokenKey => tokenKey === tokenId)) {
    showError(`Could not find tokenId ${tokenId}`)
    return
  }
  return allTokens[tokenId]
}
