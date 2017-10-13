// @flow
import React, {Component} from 'react'
import {
  Text,
  View
} from 'react-native'
import SLIcon from 'react-native-vector-icons/SimpleLineIcons'
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons'

import DropdownAlert from '../DropdownAlert/DropdownAlert.ui'
import {AlertHeader} from '../DropdownAlert/components'
import styles from './styles'

type Props = {
  displayAlert: boolean,
  dismissAlert: Function,
  message: string
}

export default class ErrorAlert extends Component<Props> {
  alertIcon = () => <MCIcon name={'alert-outline'} style={styles.alertIcon} />
  infoIcon = () => <SLIcon name={'question'} style={styles.infoIcon} />

  render () {
    const {
      displayAlert,
      dismissAlert,
      message: error
    } = this.props

    return <DropdownAlert visible={displayAlert} onClose={dismissAlert}>
      <View style={styles.alertContainer}>
        <AlertHeader style={styles.alertHeader}>
          {this.alertIcon()}
          <Text style={styles.alertHeaderText}>
            {error}
          </Text>
          {this.infoIcon()}
        </AlertHeader>
      </View>
    </DropdownAlert>
  }
}
