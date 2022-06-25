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

export const LoanBorrowDetailsScene = (props: Props) => {
  const { route, navigation } = props
  const { borrowEngine, borrowPlugin } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  //
  // Static Placeholders
  //

  const debtCurrencyCode = 'DAI'
  const borrowTotalValue = '10,000'
  const loanFiatValue = '$5,001 USD'
  const interestRate = '12.4%'

  const handleRepayPress = () => {
    navigation.navigate('loanRepayScene', { borrowEngine, borrowPlugin })
  }

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
            <Card marginRem={[0, 0, 1, 0]}>
              <TappableRow sideways center>
                <Space right>
                  <Fontello name="borrow-more" size={theme.rem(1.5)} color={theme.iconTappable} />
                </Space>
                <EdgeText style={styles.actionLabel}>{s.strings.loan_borrow_more}</EdgeText>
              </TappableRow>
            </Card>
            <Card marginRem={[0, 0, 1, 0]}>
              <TappableRow sideways center onPress={handleRepayPress}>
                <Space right>
                  <Fontello name="make-payment" size={theme.rem(1.5)} color={theme.iconTappable} />
                </Space>
                <EdgeText style={styles.actionLabel}>{s.strings.loan_make_payment}</EdgeText>
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

    actionLabel: {
      fontFamily: theme.fontFaceMedium
    }
  }
})
