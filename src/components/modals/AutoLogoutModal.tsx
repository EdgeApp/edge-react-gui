import { Picker } from '@react-native-picker/picker'
import * as React from 'react'
import { Appearance, Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import Feather from 'react-native-vector-icons/Feather'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { DisplayTime, displayToSeconds, secondsToDisplay } from '../../util/displayTime'
import { ButtonsView } from '../buttons/ButtonsView'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<number | undefined>
  autoLogoutTimeInSeconds: number
}

export const AutoLogoutModal = (props: Props) => {
  const { autoLogoutTimeInSeconds, bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [displayTime, setDisplayTime] = React.useState<DisplayTime>(secondsToDisplay(autoLogoutTimeInSeconds))

  // In Android, the Picker will be hidden with the text overlay.
  // Determine correct contrasting text color for the native Android Picker
  // menu. The selected option will show the normal theme color in a text
  // overlay, but the Picker's color itself must be set to a color that
  // contrasts with the Android OS theme.
  const isAndroid = Platform.OS === 'android'
  const textColor = React.useMemo(() => {
    if (isAndroid) {
      const colorScheme = Appearance.getColorScheme()
      return colorScheme === 'dark' ? theme.nativeComponentTextDark : theme.nativeComponentTextLight
    } else {
      return theme.pickerText
    }
  }, [theme, isAndroid])

  const numberPickerOptions = [<Picker.Item key="disable" label={lstrings.string_disable} value={0} color={textColor} />]
  for (let i = 1; i < 60; i++) {
    const text = String(i)
    numberPickerOptions.push(<Picker.Item key={text} label={text} value={i} color={textColor} />)
  }

  const measurementOptionsStrings = {
    seconds: lstrings.settings_seconds,
    minutes: lstrings.settings_minutes,
    hours: lstrings.settings_hours,
    days: lstrings.settings_days
  }

  const datePickerOptions = [
    { label: measurementOptionsStrings.seconds, value: 'seconds' },
    { label: measurementOptionsStrings.minutes, value: 'minutes' },
    { label: measurementOptionsStrings.hours, value: 'hours' },
    { label: measurementOptionsStrings.days, value: 'days' }
  ].map(option => <Picker.Item key={option.value} label={option.label} value={option.value} color={textColor} />)

  const handleDone = useHandler(() => {
    bridge.resolve(displayToSeconds(displayTime))
  })

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  // Default to `hours` if it's disabled:
  React.useEffect(() => {
    if (displayTime.value === 0) setDisplayTime({ ...displayTime, measurement: 'hours' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <EdgeModal bridge={bridge} onCancel={handleCancel} title={lstrings.dialog_title}>
      <View style={styles.pickerContainer}>
        {isAndroid ? (
          <View style={styles.androidPickerContainer}>
            <Picker style={styles.androidPicker} selectedValue={displayTime.value} onValueChange={value => setDisplayTime({ ...displayTime, value })}>
              {numberPickerOptions}
            </Picker>
            <View style={styles.androidPickerOverlayContainer} pointerEvents="none">
              <EdgeText style={styles.androidPickerText}>{displayTime.value === 0 ? lstrings.string_disable : displayTime.value}</EdgeText>
              <Feather name="chevron-down" color={theme.iconTappable} size={theme.rem(1.5)} />
            </View>
          </View>
        ) : (
          <Picker style={styles.picker} selectedValue={displayTime.value} onValueChange={value => setDisplayTime({ ...displayTime, value })}>
            {numberPickerOptions}
          </Picker>
        )}

        {isAndroid ? (
          <View style={styles.androidPickerContainer}>
            <Picker
              style={styles.androidPicker}
              selectedValue={displayTime.measurement}
              onValueChange={measurement => setDisplayTime({ ...displayTime, measurement })}
            >
              {datePickerOptions}
            </Picker>
            <View style={styles.androidPickerOverlayContainer} pointerEvents="none">
              <EdgeText style={styles.androidPickerText}>{measurementOptionsStrings[displayTime.measurement]}</EdgeText>
              <Feather name="chevron-down" color={theme.iconTappable} size={theme.rem(1.5)} />
            </View>
          </View>
        ) : (
          <Picker style={styles.picker} selectedValue={displayTime.measurement} onValueChange={measurement => setDisplayTime({ ...displayTime, measurement })}>
            {datePickerOptions}
          </Picker>
        )}
      </View>
      <ButtonsView primary={{ label: lstrings.string_save, onPress: handleDone }} layout="column" />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  androidPicker: {
    position: 'absolute',
    top: -theme.rem(1),
    left: theme.rem(1),
    bottom: 0,
    right: 0
  },
  androidPickerContainer: {
    flex: 1,
    position: 'relative',
    paddingHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(1)
  },
  androidPickerOverlayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.modal,
    borderRadius: theme.cardBorderRadius,
    borderWidth: theme.cardBorder,
    borderColor: theme.cardBorderColor
  },
  androidPickerText: {
    marginHorizontal: theme.rem(0.5)
  },
  picker: {
    flex: 1
  },
  pickerContainer: {
    flexDirection: 'row'
  },
  iosPickerText: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false
  }
}))
