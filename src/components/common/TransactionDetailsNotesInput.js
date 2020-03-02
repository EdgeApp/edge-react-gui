// @flow
import { bns } from 'biggystring'
import React, { Component } from 'react'
import { View, TextInput, TouchableWithoutFeedback } from 'react-native'
import s from '../../locales/strings.js'
import { type AirshipBridge, AirshipModal } from '../modals/modalParts'
import { sprintf } from 'sprintf-js'

import { intl } from '../../locales/intl'
import ContactSearchResults from './ContactSearchResults.js'
import { FormField } from '../common/FormField'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import styles, { materialInput } from '../../styles/scenes/TransactionDetailsStyle'
import { truncateDecimals } from '../../util/utils'
import THEME from '../../theme/variables/airbitz'

type Props = {
  bridge: AirshipBridge<null>,
  notes: string,
  onChange: (string) => void
}

type State = {
  notes: string
}

export class TransactionDetailsNotesInput extends Component<Props, State> {
  input: any
  constructor (props: Props) {
    super(props)
    this.state = { notes: props.notes }
    this.input = React.createRef()
  }
  onChange = (notes: string) => {
    this.setState({ notes })
    this.props.onChange(notes)
  }
  render() {
    const { bridge } = this.props
    const { notes } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{s.strings.transaction_details_notes_title}</FormattedText>
            <TouchableWithoutFeedback onPress={() => this.input.focus()}>
              <View style={[styles.notesInputWrap]}>
                <TextInput
                  autoFocus
                  multiline
                  autoCorrect={false}
                  style={styles.notesInput}
                  autoCapitalize="sentences"
                  underlineColorAndroid={'transparent'}
                  placeholderTextColor={THEME.COLORS.GRAY_3}
                  value={notes}
                  ref={this.input}
                  onChangeText={this.onChange}
                  placeholder={s.strings.transaction_details_notes_title}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
}
