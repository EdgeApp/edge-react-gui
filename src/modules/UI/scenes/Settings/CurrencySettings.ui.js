import React, { Component } from 'react'
import t from '../../../../lib/LocaleStrings'
import strings from '../../../../locales/default'
import {sprintf} from 'sprintf-js'
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
                text: sprintf(strings.enUS['settings_denomination_buttons_bitcoin']) + ' = (1 ' + sprintf(strings.enUS['settings_denomination_buttons_bitcoin']) + ')',
                boolean: this.state.denominations.bitcoin.boolean
            },{
                value: 'mBitcoin',
                text: sprintf(strings.enUS['settings_denomination_buttons_mbitcoin']),
                boolean: this.state.denominations.mBitcoin.boolean
            },{
                value: 'bit',
                text: sprintf(strings.enUS['settings_denomination_buttons_ubitcoin']),
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
                            <T style={s.headerText}>{sprintf(strings.enUS['settings_denomination_title_btc_cap'])}</T>
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
                text: sprintf(strings.enUS['settings_denomination_buttons_ethereum']),
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
                            <T style={s.headerText}>{sprintf(strings.enUS['settings_denomination_title_eth'])}</T>
                        </View>
                    </View>
                </LinearGradient>     
                <RadioRows options={this.denominations} onPressFunction={this._onPressToggleDenomination} style={border('green')} option='eth' />                                         
            </View>
        )
    }
}

export {BTCSettings, ETHSettings}