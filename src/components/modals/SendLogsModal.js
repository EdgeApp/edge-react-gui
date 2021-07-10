// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'
import { connect } from 'react-redux'

import { submitLogs } from '../../actions/SettingsActions'
import s from '../../locales/strings.js'
import type { Dispatch } from '../../types/reduxTypes'
import { type RootState } from '../../types/reduxTypes'
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

export const SendLogsModal = connect(
  (state: RootState): StateProps => ({
    isConnected: state.network.isConnected
  }),
  (dispatch: Dispatch): DispatchProps => ({
    submitLogs(notes) {
      dispatch(submitLogs(notes))
    }
  })
)(SendLogsModalComponent)
