// @flow
import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import { intl } from '../../locales/intl'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import { CryptoExchangeWalletListRowStyle as styles } from '../../styles/indexStyles'
import type { State } from '../../types/reduxTypes.js'
import { decimalOrZero, truncateDecimals } from '../../util/utils.js'

const DIVIDE_PRECISION = 18

type StateProps = {
  displayDenomination: EdgeDenomination
}

type OwnProps = {
  currencyCode: string,
  parentId: string,
  fiatSymbol: string,
  fiatBalance: string,
  nativeAmount: string,
  parentCryptoBalance: string,
  disabled: boolean,
  image: any,
  name: string,
  onPress({ id: string, currencyCode: string }): void
}
type Props = OwnProps & StateProps

type LocalState = {}

class CryptoExchangeWalletListTokenRowConnected extends Component<Props, LocalState> {
  onPress = () => {
    if (this.props.disabled) return
    this.props.onPress({
      id: this.props.parentId,
      currencyCode: this.props.currencyCode
    })
  }

  render () {
    const multiplier = this.props.displayDenomination ? this.props.displayDenomination.multiplier : '0'
    const preliminaryCryptoAmount = truncateDecimals(bns.div(this.props.nativeAmount, multiplier, DIVIDE_PRECISION), 6)
    const cryptoBalance = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6))
    return (
      <TouchableHighlight style={styles.touchable} underlayColor={styles.underlayColor} onPress={this.onPress}>
        <View style={[styles.containerToken, styles.rowContainerTop]}>
          <View style={styles.containerLeft}>
            <Image style={styles.imageContainer} source={{ uri: this.props.image }} resizeMode={'contain'} />
          </View>
          <View style={styles.walletDetailsContainer}>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={[styles.walletDetailsRowCurrency]}>{this.props.currencyCode}</FormattedText>
              <FormattedText style={[styles.walletDetailsRowValue]}>{cryptoBalance}</FormattedText>
            </View>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={[styles.walletDetailsRowName]}>{this.props.name}</FormattedText>
              <FormattedText style={[styles.walletDetailsRowFiat]}>
                {this.props.fiatSymbol} {this.props.fiatBalance}
              </FormattedText>
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

const mapStateToProps = (state: State, ownProps): StateProps => {
  const currencyCode: string = ownProps.currencyCode
  const displayDenomination: EdgeDenomination = SETTINGS_SELECTORS.getDisplayDenominationFull(state, currencyCode)

  return {
    displayDenomination
  }
}

const CryptoExchangeWalletListTokenRow = connect(
  mapStateToProps,
  null
)(CryptoExchangeWalletListTokenRowConnected)

export { CryptoExchangeWalletListTokenRow }
