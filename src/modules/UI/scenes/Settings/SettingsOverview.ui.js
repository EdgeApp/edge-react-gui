import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { TouchableWithoutFeedback,Image, ScrollView, ListView, Text, TextInput, View, StyleSheet, TouchableHighlight, Animated } from 'react-native'
import FormattedText from '../../components/FormattedText'
import { connect } from 'react-redux'
import LinearGradient from 'react-native-linear-gradient'
import { Actions } from 'react-native-router-flux'
import styles from './style'
import {border} from '../../../../util/border'

class SettingsOverview extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return(
            <View>
                <FormattedText>Howdy</FormattedText>
            </View>
        )
    }
}

export default SettingsOverviewConnect = connect(state => ({

}))(SettingsOverview)