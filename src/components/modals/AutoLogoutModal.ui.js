// @flow
/* eslint-disable flowtype/require-valid-file-annotation */

import { InputAndButtonStyle, Modal, ModalStyle, PrimaryButton, SecondaryButton } from 'edge-components'
import React, { Component } from 'react'
import { Picker, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings.js'
import styles from '../../styles/SettingsComponentsStyle'
import { colors as COLORS } from '../../theme/variables/airbitz.js'
import * as UTILS from '../../util/utils'

const DISABLE_TEXT = s.strings.string_disable
const DAYS_TEXT = s.strings.settings_days
const HOURS_TEXT = s.strings.settings_hours
const MINUTEST_TEXT = s.strings.settings_minutes
const SECONDS_TEXT = s.strings.settings_seconds

type AutoLogoutModalProps = {
  onDone: any => void,
  autoLogoutTimeInMinutes: number
}

type AutoLogoutModalState = {
  timeNumber: number,
  timeMeasurement: string
}

export default class AutoLogoutModal extends Component<AutoLogoutModalProps, AutoLogoutModalState> {
  constructor (props: AutoLogoutModalProps) {
    super(props)
    const { value, measurement } = UTILS.getTimeWithMeasurement(this.props.autoLogoutTimeInMinutes)
    this.state = {
      timeNumber: value,
      timeMeasurement: measurement
    }
  }

  onDone = (props: AutoLogoutModalState) => {
    const { timeNumber, timeMeasurement } = props
    const minutes = UTILS.getTimeInMinutes({ value: timeNumber, measurement: timeMeasurement })
    this.props.onDone(minutes)
  }

  render () {
    const logoutNumberOptions = [{ label: DISABLE_TEXT, value: Infinity }]
    for (let i = 1; i < 60; i++) {
      logoutNumberOptions.push({ label: String(i), value: i })
    }
    const logoutPeriodOptions = [
      { label: SECONDS_TEXT, value: 'seconds' },
      { label: MINUTEST_TEXT, value: 'minutes' },
      { label: HOURS_TEXT, value: 'hours' },
      { label: DAYS_TEXT, value: 'days' }
    ]

    const numberPickerOptions = logoutNumberOptions.map(option => <Picker.Item label={option.label} value={option.value} key={option.label} />)

    const numberPicker = (
      <Picker style={styles.autoLogoutPickerContainer} selectedValue={this.state.timeNumber} onValueChange={timeNumber => this.setState({ timeNumber })}>
        {numberPickerOptions}
      </Picker>
    )

    const measurementPickerOptions = logoutPeriodOptions.map(period => <Picker.Item label={period.label} value={period.value} key={period.label} />)

    const measurementPicker = (
      <Picker
        style={styles.autoLogoutPickerContainer}
        selectedValue={this.state.timeMeasurement}
        onValueChange={measurement => this.setState({ timeMeasurement: measurement })}
      >
        {measurementPickerOptions}
      </Picker>
    )

    return (
      <View style={ModalStyle.modal}>
        <Modal.Icon>
          <IonIcon name={'ios-time'} size={24} color={COLORS.primary} />
        </Modal.Icon>
        <Modal.Container>
          <Modal.Icon.AndroidHackSpacer />
          <Modal.Title style={{ textAlign: 'center' }}>{s.strings.dialog_title}</Modal.Title>
          <Modal.Body>
            <View style={{ flexDirection: 'row' }}>
              {numberPicker}
              {measurementPicker}
            </View>
          </Modal.Body>
          <Modal.Footer>
            <Modal.Row style={[InputAndButtonStyle.row]}>
              <SecondaryButton style={[InputAndButtonStyle.noButton]} onPress={() => this.props.onDone(false)}>
                <SecondaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_cancel_cap}</SecondaryButton.Text>
              </SecondaryButton>
              <PrimaryButton
                style={[InputAndButtonStyle.yesButton]}
                onPress={() => this.onDone({ timeMeasurement: this.state.timeMeasurement, timeNumber: this.state.timeNumber })}
              >
                <PrimaryButton.Text style={[InputAndButtonStyle.buttonText]}>{s.strings.string_save}</PrimaryButton.Text>
              </PrimaryButton>
            </Modal.Row>
          </Modal.Footer>
        </Modal.Container>
      </View>
    )
  }
}

export type AutoLogoutModalOpts = {
  autoLogoutTimeInMinutes: number
}

export const createAutoLogoutModal = (opts: AutoLogoutModalOpts) => {
  function AutoLogoutModalWrapped (props: { +onDone: Function }) {
    return <AutoLogoutModal {...opts} {...props} />
  }
  return AutoLogoutModalWrapped
}
