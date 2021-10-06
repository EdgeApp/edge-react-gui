// @flow
import * as React from 'react'
import { Platform, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import { scale } from '../../util/scaling.js'
import { AirshipModal } from '../common/AirshipModal.js'

type Props = {
  bridge: AirshipBridge<string>,
  title: string,
  placeholder?: string,
  notes: string
}

type State = {
  notes: string
}

export class TransactionDetailsNotesInput extends React.Component<Props, State> {
  notesInput: TextInput

  constructor(props: Props) {
    super(props)
    this.state = { notes: props.notes }
  }

  onChange = (notes: string) => {
    this.setState({ notes })
  }

  render() {
    const { bridge, title, placeholder } = this.props
    const { notes } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(notes)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(notes)}>
          <View style={styles.airshipContainer}>
            <FormattedText style={styles.airshipHeader}>{title}</FormattedText>
            <TouchableWithoutFeedback onPress={() => this.notesInput.focus()}>
              <View style={styles.inputNotesWrap}>
                <TextInput
                  autoFocus
                  multiline
                  autoCorrect={false}
                  style={styles.inputNotes}
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
            <PrimaryButton style={styles.saveButton} onPress={() => bridge.resolve(notes)}>
              <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>
            </PrimaryButton>
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
}

const rawStyles = {
  airshipContainer: {
    flex: 1,
    padding: THEME.rem(0.8)
  },
  airshipHeader: {
    fontSize: THEME.rem(1.2),
    marginBottom: THEME.rem(1),
    alignSelf: 'center'
  },
  spacer: {
    flex: 1
  },
  saveButton: {
    height: THEME.rem(3)
  },
  inputNotesWrap: {
    borderWidth: 1,
    borderColor: THEME.COLORS.TRANSACTION_DETAILS_GREY_1,
    borderRadius: 3,
    height: PLATFORM.deviceHeight * (Platform.OS === 'android' ? 0.3 : 0.35),
    padding: THEME.rem(0.8)
  },
  inputNotes: {
    color: THEME.COLORS.GRAY_2,
    fontSize: scale(15),
    fontFamily: THEME.FONTS.DEFAULT,
    paddingVertical: 0
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
