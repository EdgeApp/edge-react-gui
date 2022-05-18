// @flow

import * as React from 'react'
import { View } from 'react-native'

import s from '../../locales/strings.js'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { Card } from '../cards/Card'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { EdgeText } from './EdgeText'

type Props = {
  isTop?: boolean | null,
  cryptoAmount: string,
  currency: string,
  currencyCode: string,
  fiatCurrencyCode: string,
  fiatCurrencyAmount: string,
  walletId: string,
  walletName: string,
  total?: string,
  miningFee?: string | null
}
type State = {}

export class ExchangeQuoteComponent extends React.PureComponent<Props & ThemeProps, State> {
  renderRow = (label: React.Node, value: React.Node, style: any = {}) => {
    const styles = getStyles(this.props.theme)
    return (
      <View style={[styles.row, style]}>
        <View style={styles.label}>{label}</View>
        <View style={styles.value}>{value}</View>
      </View>
    )
  }

  renderBottom = () => {
    const { theme, isTop, fiatCurrencyAmount, fiatCurrencyCode, total, miningFee } = this.props
    if (isTop) {
      const styles = getStyles(theme)
      const totalText = `${total || fiatCurrencyAmount} ${fiatCurrencyCode}`
      return (
        <>
          {this.renderRow(
            <EdgeText style={styles.bottomText}>{s.strings.mining_fee}</EdgeText>,
            <EdgeText style={styles.bottomText}>{miningFee || '0'}</EdgeText>,
            {
              ...sidesToMargin(mapSides(fixSides([1, 0, 0], 0), theme.rem))
            }
          )}
          {this.renderRow(
            <EdgeText style={styles.bottomText}>{s.strings.string_total_amount}</EdgeText>,
            <EdgeText style={styles.bottomText}>{totalText}</EdgeText>
          )}
        </>
      )
    }
    return null
  }

  render() {
    const styles = getStyles(this.props.theme)
    const cryptoAmount = `${this.props.cryptoAmount} ${this.props.currencyCode}`
    const fiatAmount = `${this.props.fiatCurrencyAmount} ${this.props.fiatCurrencyCode}`

    return (
      <Card marginRem={[0, 1]}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <CurrencyIcon walletId={this.props.walletId} currencyCode={this.props.currencyCode} sizeRem={1.5} />
          </View>
          <View style={styles.contentContainer}>
            {this.renderRow(
              <EdgeText style={styles.contentTitle}>{this.props.currency}</EdgeText>,
              <EdgeText style={styles.contentValue}>{cryptoAmount}</EdgeText>
            )}
            {this.renderRow(
              <EdgeText style={styles.contentSubTitle}>{this.props.walletName}</EdgeText>,
              <EdgeText style={styles.contentSubValue}>{fiatAmount}</EdgeText>
            )}
          </View>
        </View>

        {this.renderBottom()}
      </Card>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.rem(1)
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  contentTitle: {
    fontFamily: theme.fontFaceMedium,
    fontWeight: '600'
  },
  contentValue: {
    fontWeight: '600',
    textAlign: 'right'
  },
  contentSubTitle: {
    flex: 1,
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  contentSubValue: {
    fontSize: theme.rem(0.75),
    color: theme.secondaryText
  },
  label: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  value: {
    marginLeft: theme.rem(0.25),
    textAlign: 'right'
  },
  bottomText: {
    fontWeight: '600',
    fontSize: theme.rem(0.75)
  }
}))

export const ExchangeQuote = withTheme(ExchangeQuoteComponent)
