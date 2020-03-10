// @flow
import React, { Component } from 'react'
import { TextInput, TouchableWithoutFeedback, View } from 'react-native'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/index'
import FormattedText from '../../modules/UI/components/FormattedText/index'
import styles from '../../styles/scenes/TransactionDetailsStyle'
import THEME from '../../theme/variables/airbitz'
import { type AirshipBridge, AirshipModal } from '../modals/modalParts'

type Props = {
  bridge: AirshipBridge<null>,
  notes: string,
  onChange: string => void
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
  render () {
    const { bridge } = this.props
    const { notes } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{s.strings.transaction_details_notes_title}</FormattedText>
            <TouchableWithoutFeedback onPress={() => this.input.focus()}>
              <View style={styles.inputNotesWrap}>
                <TextInput
                  autoFocus
                  multiline
                  autoCorrect={false}
                  style={styles.inputNotes}
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
            <View style={styles.spacer} />
            <PrimaryButton style={styles.saveButton} onPress={() => bridge.resolve(null)}>
              <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
}
