import React, { Component } from 'react'
import { View, Text } from 'react-native'
import t from '../../lib/LocaleStrings'
import style from './ReviewDetails.style'

export default class Details extends Component {
  render () {
    return (
      <View style={style.detailsContainer}>
        <View style={style.detailRow}>
          <Text style={[ style.text, style.detailText, style.detailTextLeft ]}>{t('fragment_setup_writeitdown_username_title')}:</Text>
          <Text style={[ style.text, style.detailText, style.detailTextRight ]}>{this.props.username}</Text>
        </View>
        <View style={style.detailRow}>
          <Text style={[ style.text, style.detailText, style.detailTextLeft ]}>{t('fragment_setup_writeitdown_pin_title')}:</Text>
          <Text style={[ style.text, style.detailText, style.detailTextRight ]}>{this.props.pinNumber}</Text>
        </View>
        <View style={style.detailRow}>
          <Text style={[ style.text, style.detailText, style.detailTextLeft ]}>{t('fragment_setup_writeitdown_password_title')}:</Text>
          <Text style={[ style.text, style.detailText, style.detailTextRight ]}>{this.props.password}</Text>
        </View>
      </View>
    )
  }
}
