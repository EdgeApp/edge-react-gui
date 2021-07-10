// @flow

import type { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'

import s from '../../locales/strings.js'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type AirshipBridge } from '../modals/modalParts.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText.js'
import { EdgeTextField } from './EdgeTextField.js'
import { PrimaryButton, SecondaryButton } from './ThemedButtons.js'
import { ThemedModal } from './ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<boolean>,
  buttonLabel: string,
  message: string,
  title: string
}

type StateProps = {
  account: EdgeAccount
}

type Props = OwnProps & StateProps & ThemeProps

type State = {
  input: string,
  error: string
}

class CheckPasswordModalComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      input: '',
      error: ''
    }
  }

  onInputChange = (input: string) => {
    this.setState({ input })
  }

  onSubmit = () => {
    const { bridge, account } = this.props
    account
      .checkPassword(this.state.input)
      .then(resolve => {
        resolve ? bridge.resolve(true) : this.setState({ error: s.strings.fragmet_invalid_password })
      })
      .catch(error => {
        console.log(error)
        this.setState({ error: s.strings.fragmet_invalid_password })
      })
  }

  render() {
    const { bridge, buttonLabel, message, theme, title } = this.props
    const styles = getStyles(theme)
    return (
      <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(false)}>
        <View>
          <EdgeText style={styles.title}>{title}</EdgeText>
          <EdgeText style={styles.message} numberOfLines={0}>
            {message.trim()}
          </EdgeText>
          <EdgeTextField
            returnKeyType="go"
            error={this.state.error}
            label={s.strings.confirm_password_text}
            onChangeText={this.onInputChange}
            value={this.state.input}
            containerStyle={styles.input}
            secureTextEntry
          />
        </View>
        <PrimaryButton label={buttonLabel} onPress={this.onSubmit} marginRem={[0.05, 0, 0.5, 0]} />
        <SecondaryButton label={s.strings.string_cancel_cap} onPress={() => bridge.resolve(false)} marginRem={[0.05, 0, 0.5, 0]} />
      </ThemedModal>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.rem(2)
  },
  icon: {
    left: theme.rem(0.125)
  },
  title: {
    fontSize: theme.rem(1.25),
    textAlign: 'center',
    margin: theme.rem(0.25)
  },
  message: {
    textAlign: 'center',
    marginBottom: 0
  },
  input: {
    marginBottom: theme.rem(1.5)
  }
}))

export const CheckPasswordModal = connect(
  (state: RootState): StateProps => ({
    account: state.core.account
  }),
  (dispatch: Dispatch) => ({})
)(withTheme(CheckPasswordModalComponent))
