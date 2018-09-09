// @flow

import React, { Component } from 'react'
import { Platform, TouchableOpacity } from 'react-native'

import * as Constants from '../../../../../constants/indexConstants.js'
import T from '../../../components/FormattedText'
import { Icon } from '../../Icon/Icon.ui.js'
import styles from '../style'

const isIos = Platform.OS === 'ios'

export type Props = {
  withArrow: boolean,
  onPress: () => mixed,
  label?: string
}
export default class BackButton extends Component<Props> {
  static defaultProps = {
    withArrow: false,
    onPress: () => {}
  }

  render () {
    const { withArrow } = this.props
    const icon = isIos ? 'ios-arrow-back-outline' : 'md-arrow-back'

    return (
      <TouchableOpacity style={styles.backButton} onPress={this.props.onPress}>
        {withArrow && <Icon size={22} name={icon} type={Constants.ION_ICONS} style={styles.backIconStyle} />}
        {withArrow && !isIos ? null : <T style={[styles.sideText]}>{this.props.label}</T>}
      </TouchableOpacity>
    )
  }
}
