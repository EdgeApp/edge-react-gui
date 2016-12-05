import React, { Component } from 'react'
import { View, Text } from 'react-native'
import t from '../../lib/LocaleStrings'
import style from './style'

export default class Details extends Component {
  render () {
    return (
      <View style={style.detailsContainer}>
        <Text style={style.text}>
          {t('fragment_setup_writeitdown_text')}
        </Text>
        <Text style={[ style.text, style.warning ]}>
          {t('fragment_setup_writeitdown_text_warning')}
        </Text>
      </View>
    )
  }
}
