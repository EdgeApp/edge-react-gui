// @flow

import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../../assets/vector'
import { useRefresher } from '../../../hooks/useRefresher'
import s from '../../../locales/strings'
import { type BorrowEngine } from '../../../plugins/borrow-plugins/types'
import { useCallback } from '../../../types/reactHooks'
import { type RouteProp } from '../../../types/routerTypes'
import { LoanDetailsSummaryCard } from '../../cards/LoanDetailsSummaryCard'
import { TappableCard } from '../../cards/TappableCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { Space } from '../../layout/Space'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { useCryptoTextSimple } from '../../text/CryptoText'
import { SectionHeading } from '../../text/SectionHeading'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { getToken, useFiatTotal } from './LoanDetailsScene'

type Props = {
  route: RouteProp<'loanBorrowDetails'>
}

export const LoanBorrowDetailsScene = (props: Props) => {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { route } = props
  const { params } = route
  const { borrowPlugin } = params

  // Refreshing borrowEngine
  const borrowEngineRefresher = useCallback(() => borrowPlugin.makeBorrowEngine(params.borrowEngine.currencyWallet), [borrowPlugin, params.borrowEngine])
  const borrowEngine = useRefresher<BorrowEngine>(borrowEngineRefresher, params.borrowEngine, 10000)

  const { currencyWallet: wallet } = borrowEngine

  // Selected Debt
  const selectedDebt = borrowEngine.debts.find(debt => debt.tokenId === params.tokenId)
  const selectedDebtToken = getToken(wallet, selectedDebt?.tokenId)

  // This is okay to crash because we should be able to assert that a correct tokenId was passed
  if (selectedDebt == null || selectedDebtToken == null) {
    throw new Error(`Failed to find debt allocation from tokenId route param ${params.tokenId}`)
  }

  // Derive state from selectedDebt:
  const { tokenId: selectedTokenId, apr: selectedApr, nativeAmount: selectedNativeAmount } = selectedDebt
  const borrowTotalValue = useCryptoTextSimple({ wallet, tokenId: selectedTokenId, nativeAmount: selectedNativeAmount })
  const loanFiatValue = useFiatTotal(wallet, [selectedDebt])
  const debtCurrencyCode = selectedDebtToken.currencyCode
  const interestRate = `${(selectedApr * 100).toFixed(0)}%`

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_borrow_details_title} style={styles.sceneHeader}>
        <Space right>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </Space>
      </SceneHeader>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <Space veritcal>
          <Space horizontal>
            <LoanDetailsSummaryCard
              currencyIcon={<CryptoIcon currencyCode={debtCurrencyCode} hideSecondary />}
              currencyCode={debtCurrencyCode}
              total={borrowTotalValue}
              details={[
                {
                  label: s.strings.loan_fiat_value,
                  value: loanFiatValue
                },
                {
                  label: s.strings.loan_interest_rate,
                  value: interestRate
                }
              ]}
            />
          </Space>
          <Space horizontal>
            <Space veritcal>
              <SectionHeading>{s.strings.loan_actions_title}</SectionHeading>
            </Space>
            <TappableCard marginRem={[0, 0, 1, 0]}>
              <Space right>
                <Fontello name="borrow-more" size={theme.rem(1.5)} color={theme.iconTappable} />
              </Space>
              <EdgeText style={styles.actionLabel}>{s.strings.loan_borrow_more}</EdgeText>
            </TappableCard>
            <TappableCard marginRem={[0, 0, 1, 0]}>
              <Space right>
                <Fontello name="make-payment" size={theme.rem(1.5)} color={theme.iconTappable} />
              </Space>
              <EdgeText style={styles.actionLabel}>{s.strings.loan_make_payment}</EdgeText>
            </TappableCard>
          </Space>
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

    actionLabel: {
      fontFamily: theme.fontFaceMedium
    }
  }
})
