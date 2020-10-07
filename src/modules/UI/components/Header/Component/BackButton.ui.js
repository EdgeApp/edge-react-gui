// @flow

import * as React from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import T from '../../../components/FormattedText/FormattedText.ui.js'
import styles from '../style'

const isIos = Platform.OS === 'ios'

export type Props = {
  withArrow: boolean,
  onPress: () => mixed,
  label?: string
}
export default class BackButton extends React.Component<Props> {
  static defaultProps = {
    withArrow: false,
    onPress: () => {}
  }

  render() {
    const { withArrow } = this.props
    const icon = isIos ? 'ios-arrow-back' : 'md-arrow-back'

    return (
      <TouchableOpacity style={styles.backButton} onPress={this.props.onPress}>
        {withArrow && <IonIcon size={22} name={icon} style={[styles.backIconStyle, !isIos && styles.backIconAndroid]} />}
        {withArrow && !isIos ? null : <T style={styles.sideText}>{this.props.label}</T>}
      </TouchableOpacity>
    )
  }
}
