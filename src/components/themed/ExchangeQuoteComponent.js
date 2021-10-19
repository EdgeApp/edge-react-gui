// @flow

import * as React from 'react'
import FastImage from 'react-native-fast-image'

import s from '../../locales/strings.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { Card } from './Card'
import { CardContent } from './CardContent'
import { DataRow } from './DataRow'
import { EdgeText } from './EdgeText'

type Props = {
  isTop?: boolean | null,
  walletIcon: string,
  cryptoAmount: string,
  currency: string,
  currencyCode: string,
  fiatCurrencyCode: string,
  fiatCurrencyAmount: string,
  walletName: string,
  total?: string,
  miningFee?: string | null
}
type State = {}

export class ExchangeQuoteComponent extends React.PureComponent<Props & ThemeProps, State> {
  renderBottom = () => {
    if (this.props.isTop) {
      const styles = getStyles(this.props.theme)
      const totalText = `${this.props.total || this.props.fiatCurrencyAmount} ${this.props.fiatCurrencyCode}`
      return (
        <>
          <DataRow
            marginRem={[1, 0, 0]}
            label={<EdgeText style={styles.bottomText}>{s.strings.mining_fee}</EdgeText>}
            value={<EdgeText style={styles.bottomText}>{this.props.miningFee || '0'}</EdgeText>}
          />
          <DataRow
            label={<EdgeText style={styles.bottomText}>{s.strings.string_total_amount}</EdgeText>}
            value={<EdgeText style={styles.bottomText}>{totalText}</EdgeText>}
          />
        </>
      )
    }
    return null
  }

  render() {
    const styles = getStyles(this.props.theme)
    return (
      <Card>
        <CardContent
          image={<FastImage style={styles.currencyIcon} source={{ uri: this.props.walletIcon }} />}
          title={this.props.currency}
          subTitle={this.props.walletName}
          value={`${this.props.cryptoAmount} ${this.props.currencyCode}`}
          subValue={`${this.props.fiatCurrencyAmount} ${this.props.fiatCurrencyCode}`}
        />
        {this.renderBottom()}
      </Card>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  bottomText: {
    fontWeight: '600',
    fontSize: theme.rem(0.75)
  },
  currencyIcon: {
    height: theme.rem(1.5),
    width: theme.rem(1.5),
    resizeMode: 'contain'
  }
}))

export const ExchangeQuote = withTheme(ExchangeQuoteComponent)
