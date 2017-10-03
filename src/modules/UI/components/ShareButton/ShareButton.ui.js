import React, {Component} from 'react'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import FormattedText from '../FormattedText'

const styles = StyleSheet.flatten({
  shareButton: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'stretch',
    justifyContent: 'center',
    paddingVertical: 7    ,
    flexDirection: 'row'
  },
  outerView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    flex: 1,
  },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2
  },
  text: {
    fontSize: 17,
    color: 'rgba(255,255,255,1)'
  }
})

export default class ShareButton extends Component {
  render () {
    const {displayName, onPress, style, border} = this.props
    return <TouchableOpacity onPress={onPress} style={[ styles.shareButton, style]} activeOpacity={0.2}>
      <View style={[styles.outerView]}>
        <View style={[styles.view, border]}>
          <FormattedText style={[styles.text]}>{displayName}</FormattedText>
        </View>
      </View>
    </TouchableOpacity>
  }
}
