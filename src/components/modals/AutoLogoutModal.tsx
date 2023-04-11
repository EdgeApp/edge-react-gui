import { Picker } from '@react-native-picker/picker'
import * as React from 'react'
import { Appearance, Platform, Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../locales/strings'
import { dayText } from '../../styles/common/textStyles'
import { THEME } from '../../theme/variables/airbitz'
import { DisplayTime, displayToSeconds, secondsToDisplay } from '../../util/displayTime'
import { AirshipModal } from '../legacy/AirshipModal'
import { PrimaryButton } from '../legacy/Buttons/PrimaryButton.ui'
import { SecondaryButton } from '../legacy/Buttons/SecondaryButton.ui'
import { ContentArea } from '../legacy/ContentArea'
import { IconCircle } from '../legacy/IconCircle'
import { LadderLayout } from '../legacy/LadderLayout'
import { ThemeProps, withTheme } from '../services/ThemeContext'

interface OwnProps {
  bridge: AirshipBridge<number | undefined>
  autoLogoutTimeInSeconds: number
}

type State = DisplayTime

type Props = OwnProps & ThemeProps

export class AutoLogoutModalComponent extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { autoLogoutTimeInSeconds } = this.props
    this.state = secondsToDisplay(autoLogoutTimeInSeconds)

    // Default to `hours` if it's disabled:
    // @ts-expect-error
    if (this.state.value === 0) this.state.measurement = 'hours'
  }

  handleDone = () => {
    this.props.bridge.resolve(displayToSeconds(this.state))
  }

  handleCancel = () => {
    const { bridge } = this.props
    bridge.resolve(undefined)
  }

  render() {
    const { bridge, theme } = this.props
    const pickerColor: any = Platform.OS === 'android' ? theme.pickerTextLight : null
    const textColor = Appearance.getColorScheme() === 'dark' && Platform.OS === 'android' ? theme.pickerTextDark : theme.pickerTextLight

    const numberPickerOptions = [<Picker.Item key="disable" label={lstrings.string_disable} value={0} color={textColor} />]
    for (let i = 1; i < 60; i++) {
      const text = String(i)
      numberPickerOptions.push(<Picker.Item key={text} label={text} value={i} color={textColor} />)
    }

    const numberPicker = (
      <Picker style={{ flex: 1, color: pickerColor }} selectedValue={this.state.value} onValueChange={value => this.setState({ value })}>
        {numberPickerOptions}
      </Picker>
    )

    const measurementPicker = (
      <Picker style={{ flex: 1, color: pickerColor }} selectedValue={this.state.measurement} onValueChange={measurement => this.setState({ measurement })}>
        <Picker.Item color={textColor} label={lstrings.settings_seconds} value="seconds" />
        <Picker.Item color={textColor} label={lstrings.settings_minutes} value="minutes" />
        <Picker.Item color={textColor} label={lstrings.settings_hours} value="hours" />
        <Picker.Item color={textColor} label={lstrings.settings_days} value="days" />
      </Picker>
    )

    return (
      <AirshipModal bridge={bridge} onCancel={this.handleCancel}>
        <IconCircle>
          <IonIcon name="ios-time" size={THEME.rem(2)} color={THEME.COLORS.SECONDARY} />
        </IconCircle>
        <ContentArea>
          <Text
            // @ts-expect-error
            style={dayText('title')}
          >
            {lstrings.dialog_title}
          </Text>
          <View style={{ flexDirection: 'row' }}>
            <LadderLayout horizontal padding={THEME.rem(1)}>
              {numberPicker}
              {measurementPicker}
            </LadderLayout>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <LadderLayout horizontal padding={THEME.rem(1)}>
              <SecondaryButton onPress={this.handleCancel} style={{ flex: 1 }}>
                <SecondaryButton.Text>{lstrings.string_cancel_cap}</SecondaryButton.Text>
              </SecondaryButton>
              <PrimaryButton onPress={this.handleDone} style={{ flex: 1 }}>
                <PrimaryButton.Text>{lstrings.string_save}</PrimaryButton.Text>
              </PrimaryButton>
            </LadderLayout>
          </View>
        </ContentArea>
      </AirshipModal>
    )
  }
}

export const AutoLogoutModal = withTheme(AutoLogoutModalComponent)
