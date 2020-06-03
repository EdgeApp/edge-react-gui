// @flow
import React, { PureComponent } from 'react'
import { Platform, StyleSheet, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import FormattedText from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { type EdgeTheme } from '../../reducers/ThemeReducer.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { PLATFORM } from '../../theme/variables/platform.js'
import type { State as StateType } from '../../types/reduxTypes.js'
import { type AirshipBridge, AirshipModal } from './modalParts.js'

type OwnProps = {
  bridge: AirshipBridge<string>,
  title: string,
  placeholder?: string,
  notes: string,
  onChange?: string => void
}

type StateProps = {
  theme: EdgeTheme
}

type State = {
  notes: string,
  styles: StyleSheet
}

type Props = OwnProps & StateProps

class TransactionDetailsNotesInputComponent extends PureComponent<Props, State> {
  notesInput: TextInput

  constructor(props: Props) {
    super(props)
    this.state = {
      notes: props.notes,
      styles: getStyles(props.theme)
    }
  }

  static getDerivedStateFromProps(props: Props) {
    return { styles: getStyles(props.theme) }
  }

  onChange = (notes: string) => {
    this.setState({ notes })
    if (this.props.onChange) {
      this.props.onChange(notes)
    }
  }

  render() {
    const { bridge, title, placeholder, theme } = this.props
    const { notes, styles } = this.state
    return (
      <AirshipModal bridge={bridge} onCancel={() => bridge.resolve(notes)}>
        <TouchableWithoutFeedback onPress={() => bridge.resolve(notes)}>
          <View style={styles.container}>
            <FormattedText style={styles.header}>{title}</FormattedText>
            <TouchableWithoutFeedback onPress={() => this.notesInput.focus()}>
              <View style={styles.wrap}>
                <TextInput
                  autoFocus
                  multiline
                  autoCorrect={false}
                  style={styles.input}
                  autoCapitalize="sentences"
                  underlineColorAndroid={THEME.COLORS.TRANSPARENT}
                  placeholderTextColor={theme.secondaryText}
                  value={notes}
                  ref={ref => (this.notesInput = ref)}
                  onChangeText={this.onChange}
                  placeholder={placeholder}
                />
              </View>
            </TouchableWithoutFeedback>
            <View style={styles.spacer} />
            <View style={styles.saveButtonContainer}>
              <PrimaryButton style={styles.saveButton} onPress={() => bridge.resolve(notes)}>
                <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>
              </PrimaryButton>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </AirshipModal>
    )
  }
}

export const TransactionDetailsNotesInput = connect((state: StateType): StateProps => ({ theme: state.theme }))(TransactionDetailsNotesInputComponent)

const { rem } = THEME
const getStyles = (theme: EdgeTheme) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: rem(1),
      backgroundColor: theme.modalBody,
      borderTopLeftRadius: rem(1),
      borderTopRightRadius: rem(1)
    },
    header: {
      fontSize: rem(1.25),
      marginBottom: rem(1),
      alignSelf: 'center',
      color: theme.headerText
    },
    wrap: {
      borderWidth: 1,
      borderColor: theme.primaryText,
      borderRadius: 3,
      height: PLATFORM.deviceHeight * (Platform.OS === 'android' ? 0.3 : 0.35),
      padding: rem(0.8)
    },
    input: {
      color: theme.primaryText,
      fontSize: rem(1),
      fontFamily: THEME.FONTS.DEFAULT,
      paddingVertical: 0
    },
    saveButtonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignItems: 'center'
    },
    saveButton: {
      width: '80%',
      borderRadius: rem(1.5),
      height: rem(3)
    }
  })
}
