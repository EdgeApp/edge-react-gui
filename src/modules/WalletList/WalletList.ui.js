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
import { updateWalletListOrder, updateArchiveListOrder, toggleWalletsVisibility, toggleArchiveVisibility } from './WalletList.action'

let wallets = {
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

let archive = {
  firstArchive: {text: 'firstArchive'},
  secondArchive: {text: 'secondArchive'},
  thirdArchive: {text: 'thirdArchive'},
  fourthArchive: {text: 'fourthArchive'},
  fifthArchive: {text: 'fifthArchive'},
  sixthArchive: {text: 'sixthArchive'}
}

let walletOrder = Object.keys(wallets)
let archiveOrder = Object.keys(archive)


class WalletList extends Component {

  forceWalletListUpdate(walletOrder) {
    this.props.dispatch(updateWalletListOrder(walletOrder))
  }

  forceArchiveListUpdate(archiveOrder) {
    this.props.dispatch(updateArchiveListOrder(archiveOrder))
  }

  toggleWalletsDropdown() {
    this.props.dispatch(toggleWalletsVisibility(this.props.walletsVisible, this.props.archiveVisible))
  }

  toggleArchiveDropdown() {
    this.props.dispatch(toggleArchiveVisibility(this.props.archiveVisible, this.props.walletsVisible))
  }

  render() {
    return(
      <View style={styles.container}>
        <LinearGradient start={{x:0,y:0}} end={{x:1, y:0}} style={[styles.totalBalanceBox]} colors={["#3b7adb","#2b569a"]}>
          <View style={[styles.totalBalanceWrap]}>
            <View style={[styles.totalBalanceHeader]}>
              <Text style={[styles.totalBalanceText]}>Total Balance</Text>
            </View>
            <View style={styles.currentBalanceBoxDollarsWrap}>
              <Text style={[styles.currentBalanceBoxDollars]}>$ 8,200.00</Text>
            </View>
            <Text style={[styles.currentBalanceBoxBits]}>b 6.4616</Text>
          </View>
        </LinearGradient>          
        <View style={styles.walletsBox}>
          <View style={styles.walletsBoxHeaderWrap}>
            <View style={[styles.walletsBoxHeaderTextWrap]}>
              <Text style={styles.walletsBoxHeaderText}>Wallets</Text>
            </View>
            <TouchableHighlight onPress={this.toggleWalletsDropdown.bind(this)} style={[styles.walletsBoxHeaderDropdown]}>
              <FAIcon name="chevron-down" size={18} style={[styles.dropdownIcon]}  color="#666666" />
            </TouchableHighlight>
          </View>
          {this.props.walletsVisible && 
            <SortableListView
              style={styles.sortableWalletList}
              data={wallets}
              order={walletOrder}
              onRowMoved={e => {
                walletOrder.splice(e.to, 0, walletOrder.splice(e.from, 1)[0]);
                console.log('walletOrder is: ', walletOrder)
                this.forceWalletListUpdate(walletOrder);
              }}
              renderRow={ row => <WalletListRow data={row} />}
            />
          }

          <View style={styles.archiveBoxHeaderWrap}>
            <View style={[styles.archiveBoxHeaderTextWrap]}>
              <Text style={styles.archiveBoxHeaderText}>Archive</Text>
            </View>
            <TouchableHighlight onPress={this.toggleArchiveDropdown.bind(this)} style={[styles.archiveBoxHeaderDropdown]}>
              <FAIcon name="chevron-down" size={18} style={[styles.dropdownIcon]}  color="#666666" />
            </TouchableHighlight>
          </View>          
          {this.props.archiveVisible && 
            <SortableListView
              style={styles.sortableWalletList}
              data={archive}
              order={archiveOrder}
              onRowMoved={e => {
                archiveOrder.splice(e.to, 0, archiveOrder.splice(e.from, 1)[0]);
                console.log('archiveOrder is: ', archiveOrder)
                this.forceArchiveListUpdate(archiveOrder);
              }}
              renderRow={ row => <WalletListRow data={row} />}
            />             
          }
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
  walletList: PropTypes.array,
  archiveList: PropTypes.array
}

export default connect( state => ({

  walletList: state.walletList.walletList,
  archiveList: state.walletList.archiveList,
  walletsVisible: state.walletList.walletsVisible,
  archiveVisible: state.walletList.archiveVisible

}) )(WalletList)
