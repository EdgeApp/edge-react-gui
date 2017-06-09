import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableWithoutFeedback,Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import T from '../../components/FormattedText'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import s from './style'
import {border} from '../../../../util/border'

class SettingsOverview extends Component {
    constructor(props) {
        super(props)

        const settings = [
            {
                text: 'Change Password',
                scene: 'changePassword'
            },
            {
                text: 'Change PIN',
                scene: 'changePin'
            },
            {
                text: 'Setup / Change Password Recovery',
                scene: 'passwordRecovery'
            },
            {
                text: '2 Factor (Enhanced Security)',
                scene: 'twoFactor'
            },
            {
                text: 'Personal Vault',
                scene: 'personalVault'
            }
    
        ]

        const options = {
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

    render() {
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
            </View>
        )
    }
}

class SettingsOverviewItem extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return(
            <View></View>
        )
    }
}

export default SettingsOverviewConnect = connect(state => ({

}))(SettingsOverview)