import React, {Component} from 'react'
import {View, StyleSheet, TouchableOpacity} from 'react-native'
import FormattedText from '../FormattedText'

const styles = StyleSheet.flatten({
  shareButton: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginHorizontal: 2,
    paddingVertical: 7    ,
    flexDirection: 'row'
  },
  outerView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    flex: 1,
    borderColor: 'white'
  },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1
  },
  text: {
    fontSize: 16,
    color: 'rgba(255,255,255,.7)'
  }
})

export default class ShareButton extends Component {
  render () {
    const {displayName, onPress, style} = this.props
    return <TouchableOpacity onPress={onPress} style={[ styles.shareButton, style]}>
      <View style={[styles.outerView]}>
        <View style={[styles.view]}>
          <FormattedText style={[styles.text]}>{displayName}</FormattedText>
        </View>
      </View>
    </TouchableOpacity>
  }
}
