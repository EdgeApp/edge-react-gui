// @flow
import React, { Component } from 'react'
import { TextInput, TouchableWithoutFeedback, View } from 'react-native'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import FormattedText from '../../modules/UI/components/FormattedText/index.js'
import styles from '../../styles/scenes/TransactionDetailsStyle.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

type Props = {
  bridge: AirshipBridge<null>,
  title: string,
  placeholder: string,
  notes: string,
  onChange: string => void
}

type State = {
  notes: string
}

export class TransactionDetailsNotesInput extends Component<Props, State> {
  notesInput: TextInput

  constructor(props: Props) {
    super(props)
    this.state = { notes: props.notes }
  }

  onChange = (notes: string) => {
    this.setState({ notes })
    this.props.onChange(notes)
  }

  render() {
    const { bridge, title, placeholder } = this.props
    const { notes } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(null)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(null)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{title}</FormattedText>
            <TouchableWithoutFeedback onPress={() => this.notesInput.focus()}>
              <View style={styles.inputNotesWrap}>
                <TextInput
                  autoFocus
                  multiline
                  autoCorrect={false}
                  style={styles.inputNotes}
                  autoCapitalize="sentences"
                  underlineColorAndroid={THEME.COLORS.TRANSPARENT}
                  placeholderTextColor={THEME.COLORS.GRAY_3}
                  value={notes}
                  ref={ref => (this.notesInput = ref)}
                  onChangeText={this.onChange}
                  placeholder={placeholder}
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
