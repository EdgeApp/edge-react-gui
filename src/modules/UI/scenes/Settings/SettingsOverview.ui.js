import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Switch, TouchableOpacity, Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import T from '../../components/FormattedText'
import {SettingsItemWithRoute, SettingsItemWithModal, SettingsItemWithSwitch} from './SettingsItems.ui'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import IonIcon from 'react-native-vector-icons/Ionicons'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import s from './style'
import {border} from '../../../../util/border'

class SettingsOverview extends Component {
    constructor(props) {
        super(props)

        this.settings = [
            {
                key: 'changePassword',
                text: 'Change Password'
            },
            {
                key: 'changePin',
                text: 'Change PIN'
            },
            {
                key: 'passwordRecovery',
                text: 'Setup / Change Password Recovery'
            },
            {
                key: 'twoFactor',
                text: '2 Factor (Enhanced Security)'
            },
            {
                key: 'personalVault',
                text: 'Personal Vault'
            }
    
        ]

        this.options = {
            merchantMode: {
                text: 'Merchant Mode',
                key: 'merchantMode'
            },
            defaultCurrency: {
                text: 'Bluetooth',
                key: 'bluetooth'
            },
            changeCategories: {
                text: 'PIN Re-Login',
                key: 'pinRelogin'
            },
            useTouchID: {
                text: 'Use TouchID',
                key: 'useTouchID'
            },
            overrideBitcoinServers: {
                text: 'Override Bitcoin Servers (Advanced)',
                key: 'overrideBitcoinServers'
            }
        }

        this.optionModals = [
            {
                key: 'autoLogoff',
                text: 'Auto log off after'
            },{
                key: 'defaultCurrency',
                text: 'Default currency'
            }
        ]
    }


    _handleOnPressRouting = (route) => {
        let goRoute = Actions[route]
        goRoute()
    }

    _onPressOpenLogoffTime = () => {
        console.log('opening auto log off modal')
    }

    _onPressOpenDefaultCurrency = () => {
        console.log('opening default currency modal?')
    }

    _onPressOpenChangeCategories = () => {
        console.log('open change categories thingy')
    }

    _onToggleOption = (property) => {
        console.log('toggling option: ', option)
    }

    render() {
        console.log('rendering settingsOverview, this is: ', this)
        return(
            <ScrollView style={s.container}>
                <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[s.unlockRow]} colors={['#3B7ADA', '#2B5698']}>
                    <View style={[s.accountBoxHeaderTextWrap, border('yellow')]}>
                        <View style={s.leftArea}>
                            <FAIcon name='user-o' style={[s.userIcon, border('green')]} color='white' />
                            <T style={s.accountBoxHeaderText}>Account: Airbitz Super Dooper Wallet</T>
                        </View>
                    </View>
                </LinearGradient>
                <View>
                    {this.settings.map((x, i) => 
                        <SettingsItemWithRoute leftText={x.text} key={i} scene={x.key} />
                    )}
                </View>
                <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={[s.unlockRow]} colors={['#3B7ADA', '#2B5698']}>
                    <View style={[s.accountBoxHeaderTextWrap, border('yellow')]}>
                        <View style={s.leftArea}>
                            <IonIcon name='ios-options' style={[s.userIcon, border('green')]} color='white' />
                            <T style={s.accountBoxHeaderText}>Options</T>
                        </View>
                    </View>
                </LinearGradient>        
                <View>
                    {this.optionModals.map((x,i) => 
                        <SettingsItemWithModal leftText={x.text} key={x.key} modal={x.key} />
                    )}
                    <SettingsItemWithRoute leftText='Change Categories' key='changeCategories' scene='changeCategories' />                    
                    {Object.keys(this.options).map((x, i) => 
                        <SettingsItemWithSwitch leftText={this.options[x].text} key={this.options[x].key} />
                    )}                    
                </View>        
            </ScrollView>
        )
    }
}

class SettingsOverviewItem extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        console.log('rendering settingsOverviewItem, this is: ', this)
        return(
            <TouchableOpacity style={[s.settingsRowContainer]} disabled={false} onPress={() => this._handleOnPressRouting(this.props.scene)} >
                <View style={[s.settingsRowTextRow, border('red')]}>
                    <View style={[s.settingsRowLeftContainer, border('blue')]}>
                        <T style={[s.settingsRowLeftText, border('green')]}>{this.props.leftText}</T>
                    </View>
                    {this.props.rightArea}                     
                </View>
            </TouchableOpacity>
        )
    }
}

export default SettingsOverviewConnect = connect(state => ({

}))(SettingsOverview)
