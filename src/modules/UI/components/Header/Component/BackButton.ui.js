import React, {Component} from 'react'
import {TouchableOpacity, Platform} from 'react-native'

import T from '../../../components/FormattedText'
import styles from '../style'
import { Icon } from 'native-base'

const isIos = Platform.OS === 'ios'

export default class BackButton extends Component {
  static defaultProps = {
    withArrow: false,
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
