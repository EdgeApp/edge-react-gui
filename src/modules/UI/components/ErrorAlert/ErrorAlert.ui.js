// @flow

import React, { Component } from 'react'
import { Text, View } from 'react-native'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'
import SLIcon from 'react-native-vector-icons/SimpleLineIcons'

import { AlertContainer, AlertHeader } from '../DropdownAlert/components'
import DropdownAlert from '../DropdownAlert/DropdownAlert.ui'
import styles from './styles'

type Props = {
  displayAlert: boolean,
  dismissAlert: Function,
  message: string
}

const alertIcon = <MCIcon name={'alert-outline'} style={styles.alertIcon} />
const infoIcon = <SLIcon name={'question'} style={styles.infoIcon} />

export default class ErrorAlert extends Component<Props> {
  render () {
    const { displayAlert, dismissAlert, message: error } = this.props

    return (
      <DropdownAlert visible={displayAlert} onClose={dismissAlert}>
        <View>
          <AlertContainer style={styles.alertContainer}>
            <AlertHeader style={styles.alertHeader}>
              {alertIcon}
              <Text style={styles.alertHeaderText}>{error}</Text>
              {infoIcon}
            </AlertHeader>
          </AlertContainer>
        </View>
      </DropdownAlert>
    )
  }
}
