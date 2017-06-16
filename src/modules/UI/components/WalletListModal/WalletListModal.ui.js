import React, { Dimensions, Component } from 'react'
import { Modal, Text, View, TouchableHighlight,  LayoutAnimation, ScrollView, TouchableOpacity } from 'react-native'
import PropTypes from 'prop-types'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import {
  toggleWalletListModalVisibility,
  toggleSelectedWalletListModal,
  toggleScanToWalletListModal
} from './action'
import * as Animatable from 'react-native-animatable'
import {border} from '../../../utils'


class WalletListModal extends Component {
  constructor(props){
    super(props)
    if(!this.props.topDisplacement){
      this.props.topDisplacement = 68
    }
    console.log('topDisplacement is now: ', this.props.topDisplacement)
  }

  render () {
    return (
      <Animatable.View style={[this.border('green'), styles.topLevel,{position:'absolute', top: 38}]}
        animation='fadeInDown'
        duration={100} >
        {this.props.scanToWalletListModalVisibility &&
          <WalletListModalHeaderConnect />
        }
        <WalletListModalBodyConnect onPress={this.props.onPress}
          selectionFunction={this.props.selectionFunction} />
      </Animatable.View>
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }
}

WalletListModal.propTypes = {
    dropdownWalletListVisible: PropTypes.bool,
    currentScene: PropTypes.string
}
export const WalletListModalConnect = connect( state => ({
    walletList: state.ui.wallets.byId,
    dropdownWalletListVisible: state.ui.scenes.walletListModal.walletListModalVisible,
    walletTransferModalVisible: state.ui.scenes.walletTransferList.walletListModalVisible,
    scanToWalletListModalVisibility: state.ui.scenes.scan.scanToWalletListModalVisibility
}))(WalletListModal)


class WalletListModalBody extends Component {
  selectFromWallet = () => {
    LayoutAnimation.easeInEaseOut()
    console.log('selectingFromWallet')
    this.props.dispatch(toggleSelectedWalletListModal())
  }

  selectToWallet = () => {
    LayoutAnimation.easeInEaseOut()
    console.log('selectingToWallet')
    this.props.dispatch(toggleScanToWalletListModal())
  }

  render () {
    for (var idx in this.props.walletList) {
      console.log('idx is: ', idx)
      return (
        <ScrollView>
          <TouchableOpacity style={[styles.rowContainer]}
            onPress={this[this.props.selectionFunction]}>
            <View style={[styles.rowContent]}>
              <View style={[styles.rowNameTextWrap]}>
                <T style={[styles.rowNameText]}>
                  {idx.slice(0,5)}
                </T>
              </View>
            </View>
          </TouchableOpacity>

          {this.props.walletList[idx].metaTokens.map((x, i) => (
            <TouchableOpacity style={[styles.tokenRowContainer]}
              key={x.currencyCode}>
              <View style={[styles.tokenRowContent]}>
                <View style={[styles.tokenRowNameTextWrap]}>
                  <T style={[styles.tokenRowNameText]}>
                    {x.currencyCode}
                  </T>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )
    }
  }
}

WalletListModalBody.propTypes = {
    selectionFunction: PropTypes.string,
}
export const WalletListModalBodyConnect  = connect( state => ({
    walletList: state.ui.wallets.byId
}))(WalletListModalBody)


class WalletListModalHeader extends Component {
  _onSearchExit = () => {
    this.props.dispatch(toggleScanToWalletListModal())
  }

  render () {
    return (
      <View style={[styles.rowContainer, styles.headerContainer ]}>
        <View style={[styles.headerContent, this.border('yellow')]}>
          <View style={[styles.headerTextWrap, this.border('green')]}>
            <T style={[styles.headerText, {color:'white'}, this.border('purple')]}>
              Choose a wallet to transfer funds to:
            </T>
          </View>
          <TouchableHighlight style={[styles.modalCloseWrap, this.border('orange')]}
            onPress={this._onSearchExit}>
            <Ionicon style={[styles.donebutton, this.border('purple')]}
              name="ios-close" size={24}
              color='white' />
          </TouchableHighlight>
        </View>
      </View>
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }
}

export const WalletListModalHeaderConnect = connect()(WalletListModalHeader)
