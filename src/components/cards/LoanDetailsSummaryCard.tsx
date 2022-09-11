import * as React from 'react'
import { View } from 'react-native'

import s from '../../locales/strings'
import { cacheStyles, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Thermostat } from '../themed/Thermostat'
import { Card } from './Card'

type SummaryDetail = {
  label: string
  value: string
  icon?: React.ReactNode
}

type Props = {
  currencyCode: string
  currencyIcon: React.ReactNode
  details: SummaryDetail[]
  total: string
  ltv?: number
}

export const LoanDetailsSummaryCard = (props: Props) => {
  const { currencyCode, currencyIcon, details, total, ltv } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.totalContainer}>
          <View style={styles.iconContainer}>{currencyIcon}</View>
          <EdgeText style={styles.total}>{total}</EdgeText>
          <EdgeText>{currencyCode}</EdgeText>
        </View>
        <View style={styles.details}>
          {details.map((detail, index) => {
            const alignment = index === 0 ? 'flex-start' : index === details.length - 1 ? 'flex-end' : 'center'

            return (
              <View key={detail.label} style={styles.detail}>
                <View style={[styles.detailContainer, { alignItems: alignment }]}>
                  <EdgeText style={styles.detailLabel}>{detail.label}</EdgeText>
                  <EdgeText style={styles.detailValue}>{detail.value}</EdgeText>
                </View>
                <View style={styles.detailIconContainer}>{detail.icon}</View>
              </View>
            )
          })}
        </View>
        {ltv != null ? (
          <View style={styles.ltvContainer}>
            <EdgeText style={styles.detailLabel}>{s.strings.loan_loan_to_value_ratio}</EdgeText>
            <Thermostat ratio={ltv} />
          </View>
        ) : null}
      </View>
    </Card>
  )
}

const getStyles = cacheStyles(theme => {
  return {
    container: {
      flex: 1
    },
    // Total
    totalContainer: {
      alignItems: 'flex-start',
      flexDirection: 'row'
    },
    total: {
      // @ts-expect-error
      fontFamily: theme.fontFaceMedium,
      // @ts-expect-error
      fontSize: theme.rem(2),
      // @ts-expect-error
      marginRight: theme.rem(0.5),
      // @ts-expect-error
      marginLeft: theme.rem(0.5)
    },
    iconContainer: {
      alignSelf: 'center'
    },
    // Details
    details: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignSelf: 'stretch',
      // @ts-expect-error
      marginTop: theme.rem(1.5)
    },
    detail: {
      flexDirection: 'row'
    },
    detailContainer: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    detailLabel: {
      flexDirection: 'row',
      // @ts-expect-error
      fontSize: theme.rem(0.75),
      // @ts-expect-error
      lineHeight: theme.rem(1.5)
    },
    detailValue: {
      // @ts-expect-error
      fontFamily: theme.fontFaceBold,
      // @ts-expect-error
      fontSize: theme.rem(0.75)
    },
    detailIconContainer: {
      // @ts-expect-error
      marginTop: theme.rem(0.25),
      // @ts-expect-error
      marginLeft: theme.rem(0.5)
    },
    // Loan to value
    ltvContainer: {
      width: '52%',
      // @ts-expect-error
      marginTop: theme.rem(1),
      flexDirection: 'column'
    }
  }
})
