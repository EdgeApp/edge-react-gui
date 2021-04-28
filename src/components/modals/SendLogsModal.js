// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'
import { connect } from 'react-redux'

import { submitLogs } from '../../actions/SettingsActions'
import s from '../../locales/strings.js'
import type { Dispatch } from '../../types/reduxTypes'
import { type RootState } from '../../types/reduxTypes'
import { showError } from '../services/AirshipInstance'
import { EdgeTextFieldOutlined } from '../themed/EdgeTextField.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type StateProps = {
  isConnected: boolean
}

type DispatchProps = {
  submitLogs: string => Promise<void>
}

type OwnProps = {
  bridge: AirshipBridge<null>
}

type Props = OwnProps & StateProps & DispatchProps

type State = {
  input: string
}

class SendLogsModalComponent extends React.PureComponent<Props, State> {
  textInput = React.createRef()
  constructor(props: Props) {
    super(props)
    this.state = {
      input: ''
    }
  }

  componentDidMount(): * {
    if (this.textInput.current) {
      this.textInput.current.focus()
    }
  }

  onClose = () => this.props.bridge.resolve(null)

  onChange = (input: string) => this.setState({ input })

  submit = async () => {
    const { bridge, isConnected, submitLogs } = this.props
    if (!isConnected) return showError(`${s.strings.network_alert_title}`)

    submitLogs(this.state.input)
    bridge.resolve(null)
  }

  render() {
    const { bridge } = this.props
    const { input } = this.state

    return (
      <ThemedModal bridge={bridge} onCancel={this.onClose} paddingRem={[0.75, 0, 1]}>
        <ModalTitle center paddingRem={[0, 3, 1]}>
          {s.strings.settings_button_send_logs}
        </ModalTitle>
        <EdgeTextFieldOutlined
          autoFocus
          keyboardType="default"
          label={s.strings.settings_modal_send_logs_label}
          onChangeText={this.onChange}
          onSubmitEditing={this.submit}
          value={input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          marginRem={[1, 1.75]}
          ref={this.textInput}
          blurOnSubmit
          hideSearchIcon
        />
        <ModalCloseArrow onPress={this.onClose} />
      </ThemedModal>
    )
  }
}

export const SendLogsModal = connect(
  (state: RootState): StateProps => ({
    isConnected: state.network.isConnected
  }),
  (dispatch: Dispatch): DispatchProps => ({
    submitLogs: notes => dispatch(submitLogs(notes))
  })
)(SendLogsModalComponent)
