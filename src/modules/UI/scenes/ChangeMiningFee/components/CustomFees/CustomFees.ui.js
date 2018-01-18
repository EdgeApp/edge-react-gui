// @flow

import React, {Component} from 'react'

import { View, Text } from 'react-native'
import CustomFeesModal from './CustomFeesModalConnector.js'
import { PrimaryButton } from '../../../../components/Buttons/Buttons.ui'
import s from '../../../../../../locales/strings.js'

import styles from './style'

type Props = {
  onPressed: Function
}
type State = {}

export default class CustomFees extends Component<Props, State> {
  render () {
    return (
      <View style={styles.customFeeButtonContainer}>
        <PrimaryButton
          text={s.strings.fragment_wallets_set_custom_fees}
          style={styles.customFeeButton}
          onPressFunction={this.props.onPressed}
        />
        <CustomFeesModal />
      </View>
    )
  }
}
