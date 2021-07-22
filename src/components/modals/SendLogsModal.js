// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { submitLogs } from '../../actions/LogActions.js'
import s from '../../locales/strings.js'
import { connect } from '../../types/reactRedux.js'
import { showError } from '../services/AirshipInstance'
import { SingleInputModal } from './SingleInputModal'

type StateProps = {
  isConnected: boolean
}

type DispatchProps = {
  submitLogs: (notes: string) => void
}

type OwnProps = {
  bridge: AirshipBridge<null>
}

type Props = OwnProps & StateProps & DispatchProps

const SendLogsModalComponent = ({ bridge, isConnected, submitLogs }: Props) => {
  const handleSubmit = async (value: string) => {
    if (!isConnected) return showError(`${s.strings.network_alert_title}`)

    submitLogs(value)
    bridge.resolve(null)
  }

  return (
    <SingleInputModal
      bridge={bridge}
      title={s.strings.settings_button_send_logs}
      label={s.strings.settings_modal_send_logs_label}
      onSubmit={handleSubmit}
      returnKeyType="send"
    />
  )
}

export const SendLogsModal = connect<StateProps, DispatchProps, OwnProps>(
  state => ({
    isConnected: state.network.isConnected
  }),
  dispatch => ({
    submitLogs(notes) {
      dispatch(submitLogs(notes))
    }
  })
)(SendLogsModalComponent)
