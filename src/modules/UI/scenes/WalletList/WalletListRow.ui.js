import React, { Component } from 'react'
import PropTypes from 'prop-types'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated, Picker } from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import T from '../../components/FormattedText'
import Menu, { MenuContext, MenuOptions, MenuOption, MenuTrigger } from 'react-native-menu'
import {executeWalletRowOption} from './action'
import RowOptions from './WalletListRowOptions.ui'
import {border as b, cutOffText} from '../../../utils'

export const findDenominationSymbol = (denoms, value) => {
  console.log('in findDenominationSymbol, denoms is: ' , denoms, ' , and value is : ', value)
  for(v of denoms) {
    if(v.name === value) {
      return v.symbol
    }
  }
}

class WalletListRow extends Component {

  render () {
    console.log('rendering WalletListRow, this.props.data is: ', this.props.data)
    let id = this.props.data.id
    let name = this.props.data.name || sprintf(strings.enUS['string_no_name'])
    let symbol = findDenominationSymbol(this.props.data.denominations, this.props.data.currencyCode )


    return (
      <View>
        <TouchableHighlight style={[styles.rowContainer]}
          underlayColor={'#eee'}
          delayLongPress={500}
          {...this.props.sortHandlers}>
          <View style={[styles.rowContent]}>
            <View style={[styles.rowNameTextWrap]}>
              <T style={[styles.rowNameText]} numberOfLines={1}>{cutOffText(name, 34)}</T>
            </View>
            <View style={[styles.rowBalanceTextWrap]}>
              <T style={[styles.rowBalanceAmountText]}>{this.props.data.balance}</T>
              <T style={[styles.rowBalanceDenominationText]}>{this.props.data.currencyCode} ({symbol || ''})</T>
            </View>
            <RowOptions walletKey={id} archiveLabel={this.props.archiveLabel} />
          </View>
        </TouchableHighlight>
        {this.props.wallets[id].metaTokens.map((x, i) => (
          <WalletListTokenRow metaToken={x} key={x.currencyCode} balance={x.balance} currencyCode={x.currencyCode} />
        ))}
      </View>
    )
  }
}

WalletListRow.propTypes = {

}

export default connect(state => ({
  wallets: state.ui.wallets.byId
}))(WalletListRow)

class WalletListTokenRow extends Component {
  constructor(props) {
    super(props)
  }

  render () {
    return (
      <View style={[styles.tokenRowContainer]}>
        <View style={[styles.tokenRowContent]}>
          <View style={[styles.tokenRowNameTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.currencyCode}</T>
          </View>
          <View style={[styles.tokenRowBalanceTextWrap]}>
            <T style={[styles.tokenRowText]}>{this.props.balance}</T>
          </View>          
        </View>
      </View>
    )
  }
}
WalletListTokenRow.propTypes = {
  currencyCode: PropTypes.string,
  balance: PropTypes.number
}