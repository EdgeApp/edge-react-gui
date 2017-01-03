import React, { Component } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { connect } from 'react-redux'
import t from '../../../lib/LocaleStrings'

import appTheme from '../../../../Themes/appTheme'
const unselected = require('../../../img/btn_unselected.png')
const selected = require('../../../img/Green-check.png')
class PasswordRequirement extends Component {
  checkOneUpper = (validation) => validation.upperCaseChar ? selected : unselected

  checkOneLower = (validation) => validation.lowerCaseChar ? selected : unselected

  checkOneNumber = (validation) => validation.number ? selected : unselected

  checkCharacterLength = (validation) => validation.characterLength ? selected : unselected

  render () {
    return (
      <View style={style.container}>
        <Text style={[ style.text, style.textLead ]}>{t('activity_signup_password_requirements')}</Text>
        <View style={style.validationContainer}><Image source={this.checkOneUpper(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_no_uppercase')}</Text></View>
        <View style={style.validationContainer}><Image source={this.checkOneLower(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_no_lowercase')}</Text></View>
        <View style={style.validationContainer}><Image source={this.checkOneNumber(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_no_number')}</Text></View>
        <View style={style.validationContainer}><Image source={this.checkCharacterLength(this.props.validation)} style={style.passwordCheckmark} /><Text style={[ style.text ]}>{t('password_rule_too_short')}</Text></View>
      </View>
    )
  }

}

const style = StyleSheet.create({

  container: {
    height: 90,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexGrow: 1,
    backgroundColor: '#2291CF',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  validationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  passwordCheckmark: {
    height: 15,
    width: 15,
    marginRight: 5
  },
  text: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: appTheme.fontFamily
  },

  textLead: {
    marginBottom: 5,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: appTheme.fontFamily
  }

})

export default connect(state => ({
  password: state.password.password,
  validation: state.password.validation
}))(PasswordRequirement)
