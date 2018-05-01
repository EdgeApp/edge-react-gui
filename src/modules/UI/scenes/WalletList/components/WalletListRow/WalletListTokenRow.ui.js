// @flow

import React, { Component } from 'react'
import { TouchableHighlight, View } from 'react-native'
import { Actions } from 'react-native-router-flux'
import type { EdgeDenomination } from 'edge-core-js'

import { intl } from '../../../../../../locales/intl'
import * as UTILS from '../../../../../utils'
import T from '../../../../components/FormattedText'
import styles, { styles as styleRaw } from '../../style'

export type Props = {
  active: boolean,
  selectWallet: (id: string, currencyCode: string) => void,
  displayDenomination: EdgeDenomination,
  multiplier: string,
  parentId: string,
  sortHandlers: any,
  currencyCode: string,
  balance: string
}
export default class WalletListTokenRow extends Component<Props> {
  selectWallet = () => {
    const { parentId: walletId, currencyCode } = this.props
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({ params: 'walletList' })
  }

  render () {
    return (
      <TouchableHighlight
        style={[styles.tokenRowContainer, this.props.active && styles.activeOpacity]}
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
            <T style={[styles.tokenRowText]}>
              {intl.formatNumber(UTILS.convertNativeToDisplay(this.props.displayDenomination.multiplier)(this.props.balance) || '0')}
            </T>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
