import React, {Component} from 'react'
import {
  View,
  WebView
} from 'react-native'
import FormattedText from '../FormattedText'
import InfoContent from '../../../../html/enUS/info.html'

export default class DefaultBody extends Component {

  render () {

    return (
      <View>
        <FormattedText>This is just a test</FormattedText>
        <View style={{flex: 1, paddingHorizontal: 20}}>
          <WebView source={<InfoContent />} />
        </View>
      </View>
    )
  }
}
