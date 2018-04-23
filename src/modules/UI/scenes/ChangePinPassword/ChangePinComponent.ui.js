// @flow

import type { EdgeAccount, EdgeContext } from 'edge-core-js'
import { ChangePinScreen } from 'edge-login-ui-rn'
import React, { Component } from 'react'
import { View } from 'react-native'

import Gradient from '../../components/Gradient/Gradient.ui'
import SafeAreaView from '../../components/SafeAreaView'
import styles from '../Settings/style.js'

export type ChangePinOwnProps = {
  account: EdgeAccount,
  context: EdgeContext,
  showHeader: boolean
}

export type ChangePinDispatchProps = {
  onComplete: () => void
}

export type ChangePinStateProps = {
  context: EdgeContext,
  account: EdgeAccount,
  showHeader: boolean
}

type ChangePinComponentProps = ChangePinOwnProps & ChangePinDispatchProps & ChangePinStateProps

export default class ChangePassword extends Component<ChangePinComponentProps> {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <SafeAreaView>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <ChangePinScreen account={this.props.account} context={this.props.context} onComplete={this.onComplete} onCancel={this.onComplete} />
        </View>
      </SafeAreaView>
    )
  }
}
