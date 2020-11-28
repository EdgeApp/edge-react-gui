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
    const icon = isIos ? (
      <IonIcon size={22} name="ios-arrow-back" style={styles.backIconStyle} />
    ) : (
      <IonIcon size={22} name="md-arrow-back" style={[styles.backIconStyle, styles.backIconAndroid]} />
    )

    return (
      <TouchableOpacity style={styles.backButton} onPress={this.props.onPress}>
        {withArrow && icon}
        {withArrow && !isIos ? null : <T style={styles.sideText}>{this.props.label}</T>}
      </TouchableOpacity>
    )
  }
}
