import { Picker } from '@react-native-picker/picker'
import * as React from 'react'
import { Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import { WheelPicker } from 'react-native-wheel-picker-android'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { DisplayTime, displayToSeconds, secondsToDisplay } from '../../util/displayTime'
import { ModalButtons } from '../buttons/ModalButtons'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeModal } from './EdgeModal'

interface Props {
  bridge: AirshipBridge<number | undefined>
  autoLogoutTimeInSeconds: number
}

type UnitOptionValue = 'seconds' | 'minutes' | 'hours' | 'days'

/** For linking selected labels to DisplayTime-compatible values */
const unitLabelValueList: Array<{ label: string; value: UnitOptionValue }> = [
  { label: lstrings.settings_seconds, value: 'seconds' },
  { label: lstrings.settings_minutes, value: 'minutes' },
  { label: lstrings.settings_hours, value: 'hours' },
  { label: lstrings.settings_days, value: 'days' }
]

const unitLabelsAndroid: string[] = unitLabelValueList.map(option => option.label)

export const AutoLogoutModal = (props: Props) => {
  const { autoLogoutTimeInSeconds, bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const isAndroid = Platform.OS === 'android'

  const [displayTime, setDisplayTime] = React.useState<DisplayTime>(secondsToDisplay(autoLogoutTimeInSeconds))

  // Android-specific picker stuff
  const [initPositionNumber] = React.useState(displayTime.value)
  const [initPositionUnit] = React.useState(() =>
    unitLabelValueList.findIndex(option => option.value === (displayTime.value === 0 ? 'hours' : displayTime.measurement))
  )
  const [numberLabelsAndroid] = React.useState<string[]>(() => {
    const out: string[] = []
    for (let i = 0; i < 60; i++) {
      out.push(i > 0 ? `${i}` : lstrings.string_disable)
    }
    return out
  })

  // iOS
  const numberOptionsIos: React.ReactElement[] = []
  for (let i = 0; i < 60; i++) {
    numberOptionsIos.push(<Picker.Item key={i} label={i === 0 ? lstrings.string_disable : `${i}`} value={i} color={theme.pickerText} />)
  }
  const unitOptionsIos = unitLabelValueList.map(option => <Picker.Item key={option.value} label={option.label} value={option.value} color={theme.pickerText} />)

  const handleDone = useHandler(() => {
    bridge.resolve(displayToSeconds(displayTime))
  })

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  // Default to hours if it's disabled:
  React.useEffect(() => {
    if (displayTime.value === 0) setDisplayTime({ ...displayTime, measurement: 'hours' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <EdgeModal bridge={bridge} onCancel={handleCancel} title={lstrings.dialog_title}>
      <View style={styles.pickerContainer}>
        {isAndroid ? (
          <>
            <View style={styles.androidPickerContainer}>
              <WheelPicker
                data={numberLabelsAndroid}
                // TODO: Make selection window more iOS-like
                indicatorColor={theme.pickerText}
                initPosition={initPositionNumber}
                itemTextFontFamily={theme.fontFaceDefault}
                itemTextSize={theme.rem(1)}
                onItemSelected={(index: number) => setDisplayTime({ ...displayTime, value: index })}
                selectedItemTextColor={theme.pickerText}
                style={styles.androidPicker}
              />
            </View>
            <View style={styles.androidPickerContainer}>
              <WheelPicker
                data={unitLabelsAndroid}
                // TODO: Make selection window more iOS-like
                indicatorColor={theme.pickerText}
                initPosition={initPositionUnit}
                itemTextFontFamily={theme.fontFaceDefault}
                itemTextSize={theme.rem(1)}
                onItemSelected={(index: number) => setDisplayTime({ ...displayTime, measurement: unitLabelValueList[index].value })}
                selectedItemTextColor={theme.pickerText}
                style={styles.androidPicker}
              />
            </View>
          </>
        ) : (
          <>
            <Picker style={styles.picker} selectedValue={displayTime.value} onValueChange={value => setDisplayTime({ ...displayTime, value })}>
              {numberOptionsIos}
            </Picker>
            <Picker
              style={styles.picker}
              selectedValue={displayTime.measurement}
              onValueChange={measurement => setDisplayTime({ ...displayTime, measurement })}
            >
              {unitOptionsIos}
            </Picker>
          </>
        )}
      </View>
      <ModalButtons primary={{ label: lstrings.string_save, onPress: handleDone }} />
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  androidPicker: {
    height: theme.rem(7)
  },
  androidPickerContainer: {
    flexGrow: 1,
    margin: theme.rem(1)
  },
  picker: {
    flex: 1
  },
  pickerContainer: {
    flexDirection: 'row'
  }
}))
