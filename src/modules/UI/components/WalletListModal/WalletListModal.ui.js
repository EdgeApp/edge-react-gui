import React, { Dimensions, Component } from 'react'
import { Modal, Text, View } from 'react-native'
import PropTypes from 'prop-types'
import { } from 'react-native'
import FormattedText from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import Ionicon from 'react-native-vector-icons/Ionicons'
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import {  } from './action'


class WalletListModal extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        console.log('in WalletListModal and headerHeight is: ', this.props.headerHeight)
        return(
            <Modal style={styles.modalRoot} visible={this.props.dropdownWalletListVisible} transparent={true} animationType={'none'}>
                {this.props.currentScene === 'scan' && 
                    <WalletListModalHeader />
                }
                <WalletListModalBody headerHeight={this.props.headerHeight} />
            </Modal>     
        ) 


    }

    border (color) {
        return {
            borderColor: color,
            borderWidth: 1
        }
    }    
}

class WalletListModalBody extends Component {
    render() {
        console.log('in walletListModalBody and headerHeight is: ', this.props.headerHeight)
        return(
            <View style={[styles.modalBody, {backgroundColor: 'transparent'}, this.border('green'), ]}>
                <View style={{height: 40, width: 40, backgroundColor: 'white', marginTop: this.props.headerHeight, paddingTop: this.props.headerHeight}}>

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

class WalletListModalHeader extends Component {
    render() {
        return(
            <View>
                <Text>Choose a wallet to transfer funds to:</Text>
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


WalletListModal.propTypes = {
    dropdownWalletListVisible: PropTypes.bool,
    currentScene: PropTypes.string
}

export default connect(state => ({
    walletList: state.ui.wallets.byId,
    dropdownWalletListVisible: state.ui.walletListModal.walletListModalVisible,
    currentScene: state.routes.scene.sceneKey
}))(WalletListModal)