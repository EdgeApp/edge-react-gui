// @flow

import React, {Component} from 'react'
import {View} from 'react-native'
import {ChangePasswordScreen} from 'airbitz-core-js-ui'
import Gradient from '../../components/Gradient/Gradient.ui'
import styles from '../Settings/style.js'
import type {AbcContext, AbcAccount} from 'airbitz-core-types'

export type Props = {
  onComplete: Function,
  account: AbcAccount,
  context: AbcContext,
  showHeader: boolean
}

export type DispatchProps = {
  onComplete: () => void
}

export default class ChangePassword extends Component<Props> {
  onComplete = () => {
    this.props.onComplete()
  }

  render () {
    return (
      <View>
        <Gradient style={styles.gradient} />
        <View style={styles.container}>
          <ChangePasswordScreen
            account={this.props.account}
            context={this.props.context}
            onComplete={this.onComplete}
            onCancel={this.onComplete}
            showHeader={this.props.showHeader}
          />
        </View>
      </View>
    )
  }
}
