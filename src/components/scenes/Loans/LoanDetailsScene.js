// @flow

import * as React from 'react'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { Fontello } from '../../../assets/vector'
import s from '../../../locales/strings'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes'
import { Card } from '../../cards/Card'
import { LoanDetailsSummaryCard } from '../../cards/LoanDetailsSummaryCard'
import { SceneWrapper } from '../../common/SceneWrapper'
import { CryptoIcon } from '../../icons/CryptoIcon'
import { FiatIcon } from '../../icons/FiatIcon'
import { Space } from '../../layout/Space'
import { cacheStyles, useTheme } from '../../services/ThemeContext'
import { SectionHeading } from '../../text/SectionHeading'
import { EdgeText } from '../../themed/EdgeText'
import { SceneHeader } from '../../themed/SceneHeader'
import { TappableRow } from '../../themed/TappableRow'

type Props = {
  route: RouteProp<'loanDetails'>,
  navigation: NavigationProp<'loanDetails'>
}

export const LoanDetailsScene = (props: Props) => {
  const { route, navigation } = props
  const { params } = route
  const { borrowEngine, borrowPlugin } = params

  const theme = useTheme()
  const styles = getStyles(theme)

  const { loanToValue } = borrowEngine
  //
  // Static Placeholders
  //

  const fiatCurrencyCode = 'USD'
  const borrowTotalValue = '10,000'
  const collateralValue = '$15,000'
  const availableEquity = '$3,000 USD'
  const dummyDaiAmount = '5,000 DAI'
  const dummyDaiApr = 'APR: 15%'

  const handleBreakdownPress = () => {
    navigation.navigate('loanBorrowDetails', { borrowEngine, borrowPlugin })
  }
  const handleAddCollateralPress = () => {
    navigation.navigate('loanAddCollateralScene', { borrowEngine, borrowPlugin })
  }
  const handleWithdrawCollateralPress = () => {
    navigation.navigate('loanWithdrawCollateralScene', { borrowEngine, borrowPlugin })
  }
  const handleLoanClosePress = () => {
    navigation.navigate('loanClose', { borrowEngine, borrowPlugin })
  }

  return (
    <SceneWrapper>
      <SceneHeader underline title={s.strings.loan_details_title} style={styles.sceneHeader}>
        <Space right>
          <Ionicon name="information-circle-outline" size={theme.rem(1.25)} color={theme.iconTappable} />
        </Space>
      </SceneHeader>
      <KeyboardAwareScrollView extraScrollHeight={theme.rem(2.75)} enableOnAndroid>
        <Space veritcal>
          <Space horizontal>
            <LoanDetailsSummaryCard
              currencyIcon={<FiatIcon fiatCurrencyCode={fiatCurrencyCode} />}
              currencyCode={fiatCurrencyCode}
              total={borrowTotalValue}
              details={[
                { label: s.strings.loan_collateral_value, value: collateralValue },
                {
                  label: s.strings.loan_available_equity,
                  value: availableEquity,
                  icon: <Ionicon name="information-circle-outline" size={theme.rem(1)} color={theme.iconTappable} />
                }
              ]}
              ltv={loanToValue}
            />
          </Space>
          <Space horizontal>
            <Space veritcal>
              <SectionHeading>{s.strings.loan_loan_breakdown_title}</SectionHeading>
            </Space>
            <Card>
              <TappableRow onPress={() => handleBreakdownPress()}>
                <Space right>
                  <CryptoIcon currencyCode="DAI" hideSecondary />
                </Space>
                <Space>
                  <EdgeText style={styles.breakdownText}>{dummyDaiAmount}</EdgeText>
                  <EdgeText style={styles.breakdownSubText}>{dummyDaiApr}</EdgeText>
                </Space>
              </TappableRow>
            </Card>
          </Space>
          <Space horizontal>
            <Space veritcal>
              <SectionHeading>{s.strings.loan_actions_title}</SectionHeading>
            </Space>
            <Card marginRem={[0, 0, 1, 0]}>
              <TappableRow sideways center onPress={handleAddCollateralPress}>
                <Space right style={styles.actionIcon}>
                  <Fontello name="add-collateral" size={theme.rem(2)} color={theme.iconTappable} />
                </Space>
                <EdgeText style={styles.actionLabel}>{s.strings.loan_action_add_collateral}</EdgeText>
              </TappableRow>
            </Card>
            <Card marginRem={[0, 0, 1, 0]}>
              <TappableRow sideways center onPress={handleWithdrawCollateralPress}>
                <Space right style={styles.actionIcon}>
                  <Fontello name="withdraw-collateral" size={theme.rem(2)} color={theme.iconTappable} />
                </Space>
                <EdgeText style={styles.actionLabel}>{s.strings.loan_action_withdraw_collateral}</EdgeText>
              </TappableRow>
            </Card>
            <Card marginRem={[0, 0, 1, 0]}>
              <TappableRow sideways center onPress={handleLoanClosePress}>
                <Space right style={styles.actionIcon}>
                  <Fontello name="close-loan" size={theme.rem(2)} color={theme.iconTappable} />
                </Space>
                <EdgeText style={styles.actionLabel}>{s.strings.loan_action_close_loan}</EdgeText>
              </TappableRow>
            </Card>
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
