// @flow

import type { EdgeDenomination } from 'edge-core-js'
import React, { PureComponent } from 'react'
import { TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'

import { intl } from '../../../../../../locales/intl'
import * as UTILS from '../../../../../utils'
import T from '../../../../components/FormattedText'
import styles, { styles as styleRaw } from '../../style'

type OwnProps = {
  parentId: string,
  sortHandlers: any,
  currencyCode: string,
  balance: string,
  fiatSymbol: string
}

export type StateProps = {
  displayDenomination: EdgeDenomination,
  fiatBalance: string,
  isWalletFiatBalanceVisible: boolean
}

export type DispatchProps = {
  selectWallet: (id: string, currencyCode: string) => any
}

type Props = OwnProps & StateProps & DispatchProps

export class WalletListTokenRow extends PureComponent<Props> {
  selectWallet = () => {
    const { parentId: walletId, currencyCode } = this.props
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({ params: 'walletList' })
  }

  render () {
    return (
      <TouchableHighlight
        style={styles.tokenRowContainer}
        underlayColor={styleRaw.tokenRowUnderlay.color}
        delayLongPress={500}
        onPress={this.selectWallet}
        {...this.props.sortHandlers}
      >
        <View style={[styles.tokenRowContent]}>
          <View style={[styles.tokenRowNameTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.currencyCode}</T>
          </View>

          <View style={[styles.tokenRowBalanceTextWrap]}>
            {this.props.isWalletFiatBalanceVisible ? (
              <T style={[styles.tokenRowText]}>{this.props.fiatSymbol + ' ' + this.props.fiatBalance}</T>
            ) : (
              <T style={[styles.tokenRowText]}>
                {intl.formatNumber(UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(this.props.balance) || '0')}
              </T>
            )}
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
