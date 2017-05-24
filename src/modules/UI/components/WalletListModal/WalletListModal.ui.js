import React, { Dimensions, Component } from 'react'
import { Modal, Text, View, TouchableHighlight } from 'react-native'
import PropTypes from 'prop-types'
import FormattedText from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import {  } from './action'
import * as Animatable from 'react-native-animatable'


class WalletListModal extends Component {
    constructor(props){
        super(props)
        console.log('after superProps in WalletListModal, this.props is: ', this.props)
        if(!this.props.topDisplacement){
            this.props.topDisplacement = this.props.headerHeight + 4
        }
    }
    render() {
    console.log('rendering WalletListModal and this.props is:', this.props, ' this.props.topDisplacement is:' , this.props.topDisplacement)        
        return(
                <Animatable.View animation="fadeInDown" style={[this.border('green'), styles.topLevel,{position:'absolute', top: this.props.topDisplacement}]} duration={100} >
                {this.props.walletTransferModalVisible && 
                    <WalletListModalHeader />
                }                    
                    <WalletListModalBodyConnect onPress={this.props.onPress} />
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
export const WalletListModalConnect =  connect( state => ({
    headerHeight: state.ui.dimensions.headerHeight,
    walletList: state.ui.wallets.byId,
    dropdownWalletListVisible: state.ui.walletListModal.walletListModalVisible,   
    walletTransferModalVisible: state.ui.walletTransferList.walletListModalVisible
}))(WalletListModal)


class WalletListModalBody extends Component {
    constructor(props) {
        super(props)
    }
    render() {
            for (var idx in this.props.walletList) {
                return(
                    <TouchableHighlight style={[styles.rowContainer]}>
                        <View style={[styles.rowContent]}>
                            <View style={[styles.rowNameTextWrap]}>
                                <FormattedText style={[styles.rowNameText]}>{idx.slice(0,5)}</FormattedText>
                            </View>
                        </View>
                    </TouchableHighlight>
                )
            }
    }

    border (color) {
        return {
            borderColor: color,
            borderWidth: 0
        }
    }     
}
export const WalletListModalBodyConnect  = connect( state => ({
    walletList: state.ui.wallets.byId
}))(WalletListModalBody)


class WalletListModalHeader extends Component {

    _onSearchExit = () => {

    }

    render() {
        return(
            <View style={[styles.rowContainer, styles.headerContainer ]}>
                <View style={[styles.headerContent, this.border('yellow')]}>
                    <View style={[styles.headerTextWrap, this.border('green')]}>
                        <FormattedText style={[styles.headerText, {color:'white'}, this.border('purple')]} >Choose a wallet to transfer funds to:</FormattedText>
                    </View>
                    <TouchableHighlight style={[styles.modalCloseWrap, this.border('orange')]} onPress={this._onSearchExit}>
                        <View></View>
                    </TouchableHighlight>
                </View>
            </View>
        )        
    }
    border (color) {
        return {
            borderColor: color,
            borderWidth: 1
        }
    }     
}