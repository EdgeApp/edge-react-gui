// @flow

import React, { Component } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Modal from 'react-native-modal'

import * as Constants from '../../constants/indexConstants.js'
import { Icon } from '../../modules/UI/components/Icon/Icon.ui'
import { StaticModalStyle } from '../../styles/indexStyles.js'
import THEME from '../../theme/variables/airbitz'

type Props = {
  modalDismissTimerSeconds: number,
  body?: string,
  bodyComponent?: any,
  isVisible: boolean,
  cancel(): void
}
class StaticModalComponent extends Component<Props> {
  reset: number
  componentDidMount () {
    if (this.props.modalDismissTimerSeconds) {
      this.reset = setTimeout(() => {
        this.props.cancel()
      }, this.props.modalDismissTimerSeconds * 1000)
    }
  }
  componentWillUnmount () {
    clearInterval(this.reset)
  }
  renderMiddle = (styles: Object) => {
    if (this.props.bodyComponent) {
      return this.props.bodyComponent
    }
    return <Text style={styles.bodyText}>{this.props.body}</Text>
  }
  render () {
    const styles = StaticModalStyle
    return (
      <Modal style={styles.container} animationType={'slide'} isVisible={this.props.isVisible}>
        <TouchableOpacity onPress={this.props.cancel}>
          <View style={styles.modalBox}>
            <View style={styles.innerBox}>
              <LinearGradient
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={[THEME.COLORS.GRADIENT.DARK, THEME.COLORS.GRADIENT.LIGHT]}
              >
                <Icon style={styles.icon} name={Constants.CHECK_CIRCLE} size={styles.iconSize} type={Constants.SIMPLE_ICONS} />
              </LinearGradient>
              <View style={styles.bottom}>
                <View style={styles.bodyRow}>{this.renderMiddle(styles)}</View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    )
  }
}

export { StaticModalComponent }
