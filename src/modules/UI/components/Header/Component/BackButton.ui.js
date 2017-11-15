import React, {Component} from 'react'
import {TouchableOpacity} from 'react-native'
import T from '../../../components/FormattedText'
import styles from '../style'
import { Icon } from 'native-base'

export default class BackButton extends Component {
  static defaultProps = {
    withArrow: false,
  }

  render () {
    return (
      <TouchableOpacity style={styles.backButton} onPress={this.props.onPress}>
        {this.props.withArrow && <Icon size={14} name='ios-arrow-back-outline' style={styles.backIconStyle} />}
        <T style={[styles.sideText]}>{this.props.label}</T>
      </TouchableOpacity>
    )
  }
}
