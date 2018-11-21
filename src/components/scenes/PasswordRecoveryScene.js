// @flow

import { PasswordRecoveryScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'
import { View } from 'react-native'

import { scale } from '../../lib/scaling.js'
import Gradient from '../../modules/UI/components/Gradient/Gradient.ui'
import SafeAreaView from '../../modules/UI/components/SafeAreaView/index'
import styles from '../../styles/scenes/SettingsStyle.js'

type Props = {
  account: Object,
  context: Object,
  showHeader: boolean,
  onComplete(): void
}
export default class PasswordRecovery extends Component<Props> {
  render () {
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <PasswordRecoveryScreen
          account={this.props.account}
          context={this.props.context}
          onComplete={this.props.onComplete}
          onCancel={this.props.onComplete}
          showHeader={this.props.showHeader}
        />
        <View style={[styles.bottomShim, { height: scale(150) }]} />
      </SafeAreaView>
    )
  }
}
