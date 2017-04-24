import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Image, ScrollView, ListView, Text, View, StyleSheet, TouchableHighlight, Animated }  from 'react-native'
import { Container, Header, InputGroup, Input, Icon, Button } from 'native-base';
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './WalletList.style'
import SortableListView from 'react-native-sortable-listview'
import WalletListRow from './WalletListRow.ui'
import { updateWalletListOrder } from './WalletList.action'

let data = {
  world1: {text: 'world'},
  areyou2: {text: 'are you'},
  t123: {text: 123},
  this: {text: 'this'},
  a: {text: 'a'},
  real: {text: 'real'},
  drag: {text: 'drag and drop'},
  bb: {text: 'bb'},
  cc: {text: 'cc'},
  dd: {text: 'dd'},
  ee: {text: 'ee'},
  ff: {text: 'ff'},
  gg: {text: 'gg'},
  hh: {text: 'hh'},
  ii: {text: 'ii'},
  jj: {text: 'jj'},
  kk: {text: 'kk'}
}

let order = Object.keys(data)

class WalletList extends Component {
  // render row
  //do top banner
  forceUpdate(order) {
    this.props.dispatch(updateWalletListOrder(order))
  }

  render() {
    return(
      <View style={styles.container}>
        <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.currentBalanceBox, styles.totalBalanceBox]} colors={["#3b7adb","#2b569a"]}>
          <View style={[styles.currentBalanceWrap]}>
            <View style={[styles.bitcoinIconWrap]}>
              <Text style={[styles.bitcoinIcon]}>Total Balance</Text>
            </View>
            <View style={styles.currentBalanceBoxDollarsWrap}>
              <Text style={[styles.currentBalanceBoxDollars]}>$ 8,200.00</Text>
            </View>
            <Text style={[styles.currentBalanceBoxBits]}>b 6.4616</Text>
          </View>
        </LinearGradient>          
        <View style={styles.walletsBox}>
          <SortableListView
            style={styles.sortableWalletList}
            data={data}
            order={order}
            onRowMoved={e => {
              order.splice(e.to, 0, order.splice(e.from, 1)[0]);
              console.log('order is: ', order)
              this.forceUpdate(order);
            }}
            //onRowMoved={this._onRowMoved}
            //onMoveStart={this._onMoveStart}
            //onMoveEnd={this._onMoveEnd}
            //rowHasChanged={this._rowHasChanged}
            renderRow={ row => <WalletListRow data={row} />}
          />
        </View>
      </View>
    )
  }

  border(color) {
    return {
      borderColor: color,
      borderWidth: 2
    }
  }
}

WalletList.propTypes = {
  walletList: PropTypes.array
}

export default connect( state => ({

  walletList: state.walletList.walletList

}) )(WalletList)
