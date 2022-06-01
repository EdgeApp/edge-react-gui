// @flow

import * as React from 'react'

import s from '../../locales/strings.js'
import { Card } from '../cards/Card'
import { CardContent } from '../cards/CardContent'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from './CurrencyIcon.js'
import { DataRow } from './DataRow'
import { EdgeText } from './EdgeText'

type Props = {
  isTop?: boolean | null,
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
    return (
      <Card marginRem={[0, 1]}>
        <CardContent
          image={<CurrencyIcon currencyCode={this.props.currencyCode} sizeRem={1.5} />}
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
  }
}))

export const ExchangeQuote = withTheme(ExchangeQuoteComponent)
