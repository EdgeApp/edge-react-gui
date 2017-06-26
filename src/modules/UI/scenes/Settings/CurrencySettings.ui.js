import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Switch, TouchableOpacity, Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { Actions } from 'react-native-router-flux'
import s from './style'
import {border} from '../../../../util/border'
import RadioRows from '../../components/RadioRows'


class BTCSettings extends Component {
    constructor(props) {
        super(props)

        this.state = {
            denominations: {
                bitcoin: {
                    boolean: true
                },
                mBitcoin: {
                    boolean: false
                },
                bit: {
                    boolean: false
                }
            }
        }

        this.denominations = [
            {
                value: 'bitcoin',
                text: 'Bitcoin = (1 Bitcoin)',
                boolean: this.state.denominations.bitcoin.boolean
            },{
                value: 'mBitcoin',
                text: 'mBitcoin = (0.001 Bitcoin)',
                boolean: this.state.denominations.mBitcoin.boolean
            },{
                value: 'bit',
                text: 'bits = (0.0000001 Bitcoin)',
                boolean: this.state.denominations.bit.boolean
            }
        ]
    }

    _onPressToggleDenomination = (value, option) => {
        console.log('toggling bitcoin denomination, value is: ', value, ' , option is : ' , option)
    }

    render() {
        return(
            <View style={[s.bitcoinSettings, border('brown')]}>
                <LinearGradient style={[s.headerRow]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']}>
                    <View style={[s.headerTextWrap]}>
                        <View style={s.leftArea}>
                            <IonIcon name='logo-bitcoin' style={[s.headerIcon]} color='white' size={24} />
                            <T style={s.headerText}>Bitcoin Denomination</T>
                        </View>
                    </View>
                </LinearGradient>  
                <RadioRows options={this.denominations} onPressFunction={this._onPressToggleDenomination} style={border('green')} option='btc' />              
            </View>
        )
    }
}

class ETHSettings extends Component {
    constructor(props) {
        super(props)
        this.state = {
            denominations: {
                ethereum: {
                    boolean: true
                }
            }
        }

        this.denominations = [
            {
                value: 'ethereum',
                text: 'Ethereum = (1 Ethereum)',
                boolean: this.state.denominations.ethereum.boolean
            }
        ]
    }

    _onPressToggleDenomination = (value, option) => {
        console.log('toggling bitcoin denomination, value is: ', value, ' , option is : ' , option)
    }    

    render() {
        return(
            <View style={[s.ethereumSettings, border('brown')]}>
                <LinearGradient style={[s.headerRow, border('purple')]} start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']}>
                    <View style={[s.headerTextWrap, border('yellow')]}>
                        <View style={s.leftArea}>
                            <IonIcon name='logo-bitcoin' style={[s.headerIcon, border('green')]} color='white' size={24} />
                            <T style={s.headerText}>Ethereum Denomination</T>
                        </View>
                    </View>
                </LinearGradient>     
                <RadioRows options={this.denominations} onPressFunction={this._onPressToggleDenomination} style={border('green')} option='eth' />                                         
            </View>
        )
    }
}

export {BTCSettings, ETHSettings}