import React, {Component} from 'react'
import {connect} from 'react-redux'
import strings from '../../../../../../locales/default'
import {bns} from 'biggystring'
import {
  View,
  TouchableHighlight,
  Image,
  ActivityIndicator
} from 'react-native'
import styles, {styles as styleRaw} from '../../style.js'
import T from '../../../../components/FormattedText'
import {border as b, cutOffText, truncateDecimals, findDenominationSymbol} from '../../../../../utils'
import sort from '../../../../../../assets/images/walletlist/sort.png'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'

class SortableWalletListRow extends Component<Props, State> {

  render () {
    const {data} = this.props
    const walletData = data
    let multiplier, name, symbol, cryptoCurrencyName, symbolImageDarkMono

    // const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, data.currencyCode)
    if (walletData.currencyCode) { // if wallet is done loading
      let displayDenomination = SETTINGS_SELECTORS.getDisplayDenominationFromSettings(this.props.settings, walletData.currencyCode)
      multiplier = displayDenomination.multiplier
      name = walletData.name || strings.enUS['string_no_name']
      symbol = findDenominationSymbol(walletData.denominations, walletData.currencyCode)
      cryptoCurrencyName = walletData.currencyNames[walletData.currencyCode]
      symbolImageDarkMono = walletData.symbolImageDarkMono
    }
    return (
      <TouchableHighlight
        style={[b('green'), styles.rowContainer, styles.sortableWalletListRow ]}
        underlayColor={styleRaw.walletRowUnderlay.color}
        {...this.props.sortHandlers}>
          {walletData.currencyCode? (
            <View style={[styles.rowContent]}>
              <View style={[styles.rowNameTextWrap]}>
                <T style={[styles.rowNameText]} numberOfLines={1}>
                  {symbolImageDarkMono
                    && <Image style={[styles.rowCurrencyLogo, b()]} transform={[{translateY: 2}]} source={{uri: symbolImageDarkMono}} resizeMode='cover' />
                  }  {cutOffText(name, 34)}
                </T>
              </View>
              <View style={[styles.rowBalanceTextWrap]}>
                <T style={[styles.rowBalanceAmountText]}>
                  {truncateDecimals(bns.div(walletData.primaryNativeBalance, multiplier, 10, 8), 6)}
                </T>
                <T style={[styles.rowBalanceDenominationText]}>{cryptoCurrencyName}
                  ({symbol || ''})</T>
              </View>
              <View style={[styles.rowDragArea, b()]}>
                <Image
                  source={sort}
                  style={{height: 15, width: 15}}
                />
              </View>
            </View>
            ) : (
              <View style={[styles.rowContent]}>
                <View style={[styles.rowNameTextWrap]}>
                  <ActivityIndicator style={{height: 18, width: 18}}/>
                </View>
              </View>
          )}
        </TouchableHighlight>
    )
  }
}

export default connect((state) => {
  const settings = state.ui.settings

  return {
    settings
  }
})(SortableWalletListRow)
