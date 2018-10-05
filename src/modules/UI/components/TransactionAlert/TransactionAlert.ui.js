// @flow

import React, { Component } from 'react'
import { Text, View } from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import s from '../../../../locales/strings.js'
import { AlertBody, AlertContainer, AlertHeader } from '../DropdownAlert/components'
import DropdownAlert from '../DropdownAlert/DropdownAlert.ui'
import styles from './styles'

export type Props =
  | {
      displayAlert: false,
      dismissAlert: () => void,
      viewTransaction: () => void
    }
  | {
      message: string,
      displayAlert: false,
      displayName: string,
      displayAmount: string,
      displaySymbol: string,
      dismissAlert: Function,
      viewTransaction: Function
    }

export default class TransactionAlert extends Component<Props> {
  checkmarkIcon = <Icon style={styles.checkmarkIcon} name={'ios-checkmark-circle'} />
  message = () => {
    if (!this.props.displayAlert) return ''

    const { displayAmount, displayName, displaySymbol } = this.props
    const message = sprintf(s.strings.bitcoin_received, `${displaySymbol || displayName} ${displayAmount}`)

    return message
  }

  render () {
    const { displayAlert, dismissAlert, viewTransaction } = this.props

    return (
      <DropdownAlert visible={displayAlert} onClose={dismissAlert} onPress={viewTransaction}>
        {/* Do not remove <View> */}
        <View>
          <AlertContainer style={styles.alertContainer}>
            <AlertHeader style={styles.alertHeader}>{this.checkmarkIcon}</AlertHeader>
            <AlertBody>
              <Text style={styles.alertHeaderText}>{this.message()}</Text>
            </AlertBody>
          </AlertContainer>
        </View>
      </DropdownAlert>
    )
  }
}
