// @flow
import React, { Component } from 'react'
import { View, TextInput, TouchableWithoutFeedback } from 'react-native'
import s from '../../locales/strings.js'
import { type AirshipBridge, AirshipModal } from '../modals/modalParts'
import { sprintf } from 'sprintf-js'

import ContactSearchResults from './ContactSearchResults.js'
import { FormField } from '../common/FormField'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import styles, { materialInput } from '../../styles/scenes/TransactionDetailsStyle'

import type { GuiContact } from '../../types/types.js'

type Props = {
  bridge: AirshipBridge<null>,
  payeeStatus: string,
  payeeName: string,
  contacts: Array<GuiContact>,
  onChangePayee: (string, string) => void
}

type State = {
  payeeName: string
}

export class TransactionDetailsPayeeInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = { payeeName: props.payeeName }
  }
  onChangePayee = (value: string) => {
    this.props.onChangePayee(value, '')
    this.setState({ payeeName: value })
  }
  onSelectPayee = (payeeName: string, thumbnail: string) => {
    this.props.onChangePayee(payeeName, thumbnail)
    this.setState({ payeeName: payeeName })
    this.props.bridge.resolve(null)
  }
  render() {
    const { bridge, payeeStatus, contacts } = this.props
    const { payeeName } = this.state
    const payeeStatusString = sprintf(s.strings.transaction_details_payee_input, payeeStatus)
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
          <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
            <View style={styles.airshipContainer}>
              <FormattedText style={styles.airshipHeader}>{payeeStatusString}</FormattedText>
                <FormField
                  autoFocus
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyLabel={"done"}
                  returnKeyType={"done"}
                  label={payeeStatusString}
                  onChangeText={this.onChangePayee}
                  placeholder={s.strings.transaction_details_payee}
                  value={payeeName}
                  style={materialInput}
                />
                <ContactSearchResults
                  contacts={contacts}
                  currentPayeeText={payeeName}
                  onSelectPayee={this.onSelectPayee}
                />
            </View>
          </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
}
