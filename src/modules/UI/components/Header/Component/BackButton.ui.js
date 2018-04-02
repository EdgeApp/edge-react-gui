/* eslint-disable flowtype/require-valid-file-annotation */

import { Icon } from 'native-base'
import React, { Component } from 'react'
import { Platform, TouchableOpacity } from 'react-native'

import T from '../../../components/FormattedText'
import styles from '../style'

const isIos = Platform.OS === 'ios'

export default class BackButton extends Component {
  static defaultProps = {
    withArrow: false
  }

  render () {
    const { withArrow } = this.props
    const icon = isIos ? 'ios-arrow-back-outline' : 'md-arrow-back'

    return (
      <TouchableOpacity style={styles.backButton} onPress={this.props.onPress}>
        {withArrow && <Icon size={14} name={icon} style={styles.backIconStyle} />}
        {withArrow && !isIos ? null : <T style={[styles.sideText]}>{this.props.label}</T>}
      </TouchableOpacity>
    )
  }
}
