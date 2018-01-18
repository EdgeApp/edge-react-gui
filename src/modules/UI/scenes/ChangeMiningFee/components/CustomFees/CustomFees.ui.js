// @flow

import React, {Component} from 'react'

import { View, Text } from 'react-native'
import { CustomFeesModal } from './CustomFeesModalConnector.js'
import { PrimaryButton } from '../../components/Buttons/Buttons.ui'

import * as FEE from '../../../../constants/FeeConstants'
import s from '../../../../locales/strings.js'
import styles from './style'

const CUSTOM_FEE_TEXT = s.strings.change_mining_fee_custom_title

type Props = {}
type State = {}

export class CustomFees extends Component<Props, State> {
  constructor (props) {
    super(props)
    this.state = {}
  }

  render () {
    return (
      <View style={styles.customFeeButtonContainer}>
        <PrimaryButton
          text={CUSTOM_FEE_TEXT}
          style={styles.customFeeButton}
          onPressFunction={this.onPressCustomFees}
        />
        <CustomFeesModal visible={this.state.customFeeModalVisible} />
      </View>
    )
  }
}
