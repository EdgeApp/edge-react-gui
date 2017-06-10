import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableOpacity, Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
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
            autoLogoff: {
                text: 'Auto log off after',
                onPress: '',
                currentValue: ''
            },
            defaultCurrency: {
                text: 'Default Currency',
                onPress: '',
                currentValue: ''
            },
            changeCategories: {
                text: 'Change Categories',
                onPress: '',
                currentValue: '' // should be right arrow >
            }
        }
    }


    _handleOnPressRouting = (route) => {
        let goRoute = Actions[route]
        goRoute()
    }

    render() {
        console.log('rendering settingsOverview, this is: ', this)
        return(
            <View style={s.container}>
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
                        <SettingsOverviewItem leftText={x.text} key={i} scene={x.key} />
                    )}
                </View>
            </View>
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
                    <T style={[s.settingsRowLeftText, border('green')]}>{this.props.leftText}</T>
                    <MAIcon name='chevron-right' size={24} style={[s.settingsRowRightArrow, border('blue')]} color='#58595C' />
                </View>
            </TouchableOpacity>
        )
    }
}

export default SettingsOverviewConnect = connect(state => ({

}))(SettingsOverview)