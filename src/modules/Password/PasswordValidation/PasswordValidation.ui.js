import React, { Component } from 'react'
import { View, Text, StyleSheet } from 'react-native'
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
        <Text style={[ style.text, this.checkOneUpper(this.props.validation) ]}> - {t('password_rule_no_uppercase')}</Text>
        <Text style={[ style.text, this.checkOneLower(this.props.validation) ]}> - {t('password_rule_no_lowercase')}</Text>
        <Text style={[ style.text, this.checkOneNumber(this.props.validation) ]}> - {t('password_rule_no_number')}</Text>
        <Text style={[ style.text, this.checkCharacterLength(this.props.validation) ]}> - {t('password_rule_too_short')}</Text>
      </View>
    )
  }

}

const style = StyleSheet.create({

  container: {
    marginHorizontal: 10,
    marginBottom: 5
  },

  text: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: appTheme.fontFamily
  },

  textLead: {
    marginBottom: 5,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: appTheme.fontFamily
  }

})

export default connect(state => ({
  password: state.password.password,
  validation: state.password.validation
}))(PasswordRequirement)
