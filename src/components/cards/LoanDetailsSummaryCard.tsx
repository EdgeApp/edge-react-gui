import * as React from 'react'
import { View } from 'react-native'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Thermostat } from '../themed/Thermostat'
import { getLtvColorValue } from '../tiles/LtvRatioTile'
import { Card } from './Card'

interface SummaryDetail {
  label: string
  value: string
  icon?: React.ReactNode
}

interface Props {
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
              </View>
            )
          })}
        </View>
        {ltv != null ? (
          <View style={styles.ltvContainer}>
            <EdgeText style={styles.detailLabel}>{lstrings.loan_loan_to_value_ratio}</EdgeText>
            <Thermostat ratio={ltv} textColor={getLtvColorValue(ltv, theme)} />
          </View>
        ) : null}
      </View>
    </Card>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  },
  // Total
  totalContainer: {
    alignItems: 'flex-start',
    flexDirection: 'row'
  },
  total: {
    fontFamily: theme.fontFaceMedium,
    fontSize: theme.rem(2),
    marginRight: theme.rem(0.5),
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
    fontSize: theme.rem(0.75),
    lineHeight: theme.rem(1.5)
  },
  detailValue: {
    fontFamily: theme.fontFaceBold,
    fontSize: theme.rem(0.75)
  },
  detailIconContainer: {
    marginTop: theme.rem(0.25),
    marginLeft: theme.rem(0.5)
  },
  // Loan to value
  ltvContainer: {
    width: '52%',
    marginTop: theme.rem(1),
    flexDirection: 'column'
  }
}))
