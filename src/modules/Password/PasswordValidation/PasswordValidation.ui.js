import React, { Component } from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { connect } from 'react-redux'
import t from '../../../lib/LocaleStrings'

import appTheme from '../../../../Themes/appTheme'
class PasswordRequirement extends Component {

  checkOneUpper = (validation) => validation.upperCaseChar ? { color: 'blue' } : null

  checkOneLower = (validation) => validation.lowerCaseChar ? { color: 'blue' } : null

  checkOneNumber = (validation) => validation.number ? { color: 'blue' } : null

  checkCharacterLength = (validation) => validation.characterLength ? { color: 'blue' } : null

  render () {
    return (
      <View style={style.container}>
        <Text style={[ style.text, style.textLead ]}>{t('activity_signup_password_requirements')}</Text>
        <View><Image /><Text style={[ style.text, this.checkOneUpper(this.props.validation) ]}> - {t('password_rule_no_uppercase')}</Text></View>
        <View><Image /><Text style={[ style.text, this.checkOneLower(this.props.validation) ]}> - {t('password_rule_no_lowercase')}</Text></View>
        <View><Image /><Text style={[ style.text, this.checkOneNumber(this.props.validation) ]}> - {t('password_rule_no_number')}</Text></View>
        <View><Image /><Text style={[ style.text, this.checkCharacterLength(this.props.validation) ]}> - {t('password_rule_too_short')}</Text></View>
      </View>
    )
  }

}

const style = StyleSheet.create({

  container: {
    height: 90,
    padding: 10,
    backgroundColor: '#2291CF'
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
