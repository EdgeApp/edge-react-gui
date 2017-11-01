import React, {Component} from 'react'
import strings from '../../../../../../locales/default'
import {bns} from 'biggystring'
import {
  View,
  TouchableHighlight,
  ActivityIndicator,
  Image
} from 'react-native'
import {connect} from 'react-redux'
import {Actions} from 'react-native-router-flux'
import styles, {styles as styleRaw} from '../../style.js'
import T from '../../../../components/FormattedText'
import RowOptions from './WalletListRowOptions.ui'
import WalletListTokenRow from './WalletListTokenRowConnector.js'
import {border as b, cutOffText, truncateDecimals, decimalOrZero} from '../../../../../utils.js'
import {selectWallet} from '../../../../Wallets/action.js'
import * as SETTINGS_SELECTORS from '../../../../Settings/selectors'
import platform from '../../../../../../theme/variables/platform.js'
import type {GuiDenomination} from '../../../../../../types'
import type {State as ReduxState, Dispatch} from '../../../../../ReduxTypes'

const DIVIDE_PRECISION = 18

export type FullWalletRowProps = {
  data: any, // TODO: Need to type this
  sortableMode: boolean
}

type InternalProps = {
  displayDenomination: GuiDenomination,
  exchangeDenomination: GuiDenomination
}

type DispatchProps = {
  selectWallet: (walletId: string, currencyCode: string) => any
}

type Props = FullWalletRowProps & InternalProps & DispatchProps

type State = {

}

class FullWalletRow extends Component<Props, State> {
  render () {
    return (
      <View>
        {this.props.data.item.id ? (
          <FullWalletListRowConnect data={this.props.data} />
        ) : (
          <FullListRowEmptyData />
        )}
      </View>
    )
  }
}

export default FullWalletRow

class FullWalletListRow extends Component<Props, State> {

  _onPressSelectWallet = (walletId: string, currencyCode: string) => {
    this.props.selectWallet(walletId, currencyCode)
    Actions.transactionList({params: 'walletList'})
  }

  render () {
    const {data} = this.props
    const walletData = data.item
    const currencyCode = walletData.currencyCode
    const cryptocurrencyName = walletData.currencyNames[currencyCode]
    const denomination = this.props.displayDenomination
    const multiplier = denomination.multiplier
    const id = walletData.id
    const name = walletData.name || strings.enUS['string_no_name']
    const symbol = denomination.symbol
    let symbolImageDarkMono = walletData.symbolImageDarkMono
    let preliminaryCryptoAmount = truncateDecimals(bns.div(walletData.primaryNativeBalance, multiplier, DIVIDE_PRECISION), 6)
    let finalCryptoAmount = decimalOrZero(preliminaryCryptoAmount, 6) // check if infinitesimal (would display as zero), cut off trailing zeroes
    return (
      <View style={[{width: platform.deviceWidth}, b()]}>
          <View>
            <TouchableHighlight
              style={[styles.rowContainer]}
              underlayColor={styleRaw.walletRowUnderlay.color}
              {...this.props.sortHandlers}
              onPress={() => this._onPressSelectWallet(id, currencyCode)}
            >
              <View style={[styles.rowContent]}>
                <View style={[styles.rowNameTextWrap, b()]}>
                  <T style={[styles.rowNameText, b()]} numberOfLines={1}>
                  {symbolImageDarkMono
                    && <Image style={[styles.rowCurrencyLogo, b()]} transform={[{translateY: 2}]} source={{uri: symbolImageDarkMono}} resizeMode='cover' />
                  }  {cutOffText(name, 34)}</T>
                </View>
                <View style={[styles.rowBalanceTextWrap]}>
                  <T style={[styles.rowBalanceAmountText]}>
                    {finalCryptoAmount}
                  </T>
                  <T style={[styles.rowBalanceDenominationText]}>{cryptocurrencyName} ({symbol || ''})</T>
                </View>
                <RowOptions sortableMode={this.props.sortableMode} executeWalletRowOption={walletData.executeWalletRowOption} walletKey={id} archived={walletData.archived} />
              </View>
            </TouchableHighlight>
            {this.renderTokenRow(id, walletData.nativeBalances, this.props.active)}
          </View>
      </View>
    )
  }

  renderTokenRow = (parentId: string, metaTokenBalances: { [currencyCode: string]: string }) => {
    let tokens = []
    for (let property in metaTokenBalances) {
      if (property !== this.props.data.item.currencyCode) {
        tokens.push(
          <WalletListTokenRow
            parentId={parentId}
            currencyCode={property}
            key={property}
            balance={metaTokenBalances[property]}
            active={this.props.active} />)
      }
    }
    return tokens
  }
}
const mapStateToProps = (state: ReduxState, ownProps: InternalProps): InternalProps => {
  const displayDenomination = SETTINGS_SELECTORS.getDisplayDenomination(state, ownProps.data.item.currencyCode)
  const exchangeDenomination = SETTINGS_SELECTORS.getExchangeDenomination(state, ownProps.data.item.currencyCode)
  return {
    displayDenomination,
    exchangeDenomination
  }
}
const mapDispatchToProps = (dispatch: Dispatch): DispatchProps => ({
  selectWallet: (walletId, currencyCode) => dispatch(selectWallet(walletId, currencyCode))
})
export const FullWalletListRowConnect = connect(mapStateToProps, mapDispatchToProps)(FullWalletListRow)

class FullListRowEmptyData extends Component<any, State> {
  render () {
    return (
      <TouchableHighlight
        style={[
          styles.rowContainer,
          styles.emptyRow
        ]}
        underlayColor={styleRaw.emptyRowUnderlay.color}
        {...this.props.sortHandlers}
      >
        <View style={[styles.rowContent]}>
          <View style={[styles.rowNameTextWrap]}>
            <ActivityIndicator style={{height: 18, width: 18}}/>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}
