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
import {border as b} from '../../../../util/border'

class RadioRows extends Component {
    constructor(props) {
        super(props)

        this.state = {

        }
    }

    handlePress(value, option) {
        console.log('inside of RadioRows->handlePress')
        this.props.onPressFunction(value, option) // reference to inherited function
    }

    render() {
        console.log('RadioRows render, this.props is: ', this.props)
        return(
            <View style={[{height: 200}]}>
                {this.props.options.map((x, i) => (
                    <TouchableOpacity onPress={() => this.handlePress(x.value, this.props.option)} style={[s.rowContainer, b('blue')]} key={x.value}>                    
                        <View style={[s.rowTextRow, b('red')]}>
                            <View style={[s.rowLeftContainer, b('blue')]}>
                                <T style={[s.rowLeftText, b('green')]}>{x.text}</T>
                            </View>
                            {x.boolean ? (
                                <IonIcon name='ios-radio-button-on' size={24} style={[s.radioButton, b('blue')]} color='#4C78B8' />                             
                            ) : (
                                <IonIcon name='ios-radio-button-off' size={24} style={[s.radioButton, b('blue')]} color='#58595C' />  
                            )}
                        
                        </View>     
                    </TouchableOpacity>                                   
                ))
                }
            </View>
        )
    }
}

export default RadioRows