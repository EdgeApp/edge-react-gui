// @flow

import { bns } from 'biggystring'
import type { EdgeDenomination } from 'edge-core-js'
import React, { Component } from 'react'
import { Image, StyleSheet, TouchableHighlight, View } from 'react-native'
import { connect } from 'react-redux'

import * as intl from '../../locales/intl.js'
import * as SETTINGS_SELECTORS from '../../modules/Settings/selectors'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import type { State } from '../../types/reduxTypes.js'
import { scale } from '../../util/scaling.js'
import { decimalOrZero, truncateDecimals } from '../../util/utils.js'

const DIVIDE_PRECISION = 18

export type TokenSelectObject = {
  id: string,
  currencyCode: string
}

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
  onPress(TokenSelectObject): void
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

  render() {
    const multiplier = this.props.displayDenomination ? this.props.displayDenomination.multiplier : '0'
    const preliminaryCryptoAmount = truncateDecimals(bns.div(this.props.nativeAmount, multiplier, DIVIDE_PRECISION), 6)
    const cryptoBalance = intl.formatNumber(decimalOrZero(preliminaryCryptoAmount, 6))
    return (
      <TouchableHighlight underlayColor={THEME.COLORS.TRANSPARENT} onPress={this.onPress}>
        <View style={[styles.containerToken, styles.rowContainerTop]}>
          <View style={styles.containerLeft}>
            <Image style={styles.imageContainer} source={{ uri: this.props.image }} resizeMode="contain" />
          </View>
          <View style={styles.walletDetailsContainer}>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={styles.walletDetailsRowCurrency}>{this.props.currencyCode}</FormattedText>
              <FormattedText style={styles.walletDetailsRowValue}>{cryptoBalance}</FormattedText>
            </View>
            <View style={styles.walletDetailsRow}>
              <FormattedText style={styles.walletDetailsRowName}>{this.props.name}</FormattedText>
              <FormattedText style={styles.walletDetailsRowFiat}>
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

const rawStyles = {
  containerToken: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    backgroundColor: THEME.COLORS.OFF_WHITE
  },
  rowContainerTop: {
    width: '100%',
    height: scale(76),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: scale(10),
    paddingRight: scale(10),
    borderBottomWidth: scale(1),
    borderBottomColor: THEME.COLORS.GRAY_3
  },
  containerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(10),
    width: scale(36)
  },
  imageContainer: {
    height: scale(24),
    width: scale(24)
  },
  walletDetailsContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  walletDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  walletDetailsRowCurrency: {
    flex: 1,
    fontSize: scale(18)
  },
  walletDetailsRowValue: {
    textAlign: 'right',
    fontSize: scale(18),
    marginRight: scale(8),
    color: THEME.COLORS.GRAY_1
  },
  walletDetailsRowName: {
    flex: 1,
    fontSize: scale(14),
    color: THEME.COLORS.SECONDARY
  },
  walletDetailsRowFiat: {
    fontSize: scale(14),
    textAlign: 'right',
    marginRight: scale(8),
    color: THEME.COLORS.SECONDARY
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const CryptoExchangeWalletListTokenRow = connect(mapStateToProps, null)(CryptoExchangeWalletListTokenRowConnected)
