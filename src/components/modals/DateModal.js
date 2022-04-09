// @flow

import DateTimePicker from '@react-native-community/datetimepicker'
import * as React from 'react'
import { Appearance, Platform, Text, TouchableOpacity } from 'react-native'
import { type AirshipBridge, AirshipModal } from 'react-native-airship'

import s from '../../locales/strings.js'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'

export type Props = {
  bridge: AirshipBridge<Date>,
  initialValue: Date
}

type State = {
  darkMode: boolean,
  date: Date
}

/**
 * Shows the native iOS date picker inside a modal.
 */
export class DateModalIos extends React.Component<Props & ThemeProps, State> {
  subscription: { remove(): void } | void

  constructor(props: Props & ThemeProps) {
    super(props)
    this.state = {
      darkMode: Appearance.getColorScheme() === 'dark',
      date: props.initialValue
    }
  }

  componentDidMount() {
    this.subscription = Appearance.addChangeListener(({ colorScheme }) => {
      this.setState({ darkMode: colorScheme === 'dark' })
    })
  }

  componentWillUnmount() {
    if (this.subscription != null) this.subscription.remove()
  }

  /**
   * Wrap the data picker component in an Airship modal.
   * This modal doesn't use the normal theme colors,
   * since the native component inside uses its own phone-based colors.
   */
  render(): React.Node {
    const { bridge, theme } = this.props
    const { darkMode, date } = this.state

    const textStyle = {
      color: darkMode ? theme.dateModalTextDark : theme.dateModalTextLight,
      fontSize: theme.rem(1),
      textAlign: 'right',
      paddingHorizontal: theme.rem(1),
      paddingVertical: theme.rem(0.5)
    }

    return (
      <AirshipModal
        bridge={bridge}
        onCancel={this.handleDone}
        borderRadius={0}
        backgroundColor={darkMode ? theme.dateModalBackgroundDark : theme.dateModalBackgroundLight}
      >
        <TouchableOpacity onPress={this.handleDone}>
          <Text style={textStyle}>{s.strings.string_done_cap}</Text>
        </TouchableOpacity>
        <DateTimePicker display="spinner" mode="date" onChange={this.handleChange} value={date} />
      </AirshipModal>
    )
  }

  handleChange = (event: mixed, date?: Date) => {
    this.setState({ date })
  }

  handleDone = () => {
    this.props.bridge.resolve(this.state.date)
  }
}

/**
 * Displays the native Android date picker modal,
 * using the Airship system to manage its lifetime.
 */
export function DateModalAndroid(props: Props) {
  const { bridge, initialValue } = props

  return (
    <DateTimePicker
      mode="date"
      onChange={(event, date?: Date) => {
        bridge.resolve(date != null ? date : initialValue)
        bridge.remove()
      }}
      value={initialValue}
      // ref for android?
    />
  )
}

export const DateModal = Platform.OS === 'android' ? DateModalAndroid : withTheme(DateModalIos)
