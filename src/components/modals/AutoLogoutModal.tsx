import { Picker } from '@react-native-picker/picker'
import * as React from 'react'
import { Platform, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { DisplayTime, displayToSeconds, secondsToDisplay } from '../../util/displayTime'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface Props {
  bridge: AirshipBridge<number | undefined>
  autoLogoutTimeInSeconds: number
}

export const AutoLogoutModal = (props: Props) => {
  const { autoLogoutTimeInSeconds, bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const textColor = theme.pickerText
  const itemStyle = [styles.text, Platform.OS === 'android' ? styles.androidAdjust : null]

  const [displayTime, setDisplayTime] = React.useState<DisplayTime>(secondsToDisplay(autoLogoutTimeInSeconds))

  // Default to `hours` if it's disabled:
  React.useEffect(() => {
    if (displayTime.value === 0) setDisplayTime({ ...displayTime, measurement: 'hours' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDone = useHandler(() => {
    bridge.resolve(displayToSeconds(displayTime))
  })

  const handleCancel = useHandler(() => {
    bridge.resolve(undefined)
  })

  const numberPickerOptions = [<Picker.Item key="disable" label={lstrings.string_disable} value={0} color={textColor} />]
  for (let i = 1; i < 60; i++) {
    const text = String(i)
    numberPickerOptions.push(<Picker.Item key={text} label={text} value={i} color={textColor} />)
  }

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <ModalTitle>{lstrings.dialog_title}</ModalTitle>
      <View style={styles.pickerContainer}>
        <Picker
          style={styles.picker}
          itemStyle={itemStyle}
          selectedValue={displayTime.value}
          onValueChange={value => setDisplayTime({ ...displayTime, value })}
        >
          {numberPickerOptions}
        </Picker>
        <Picker
          style={styles.picker}
          itemStyle={itemStyle}
          selectedValue={displayTime.measurement}
          onValueChange={measurement => setDisplayTime({ ...displayTime, measurement })}
        >
          <Picker.Item color={textColor} label={lstrings.settings_seconds} value="seconds" />
          <Picker.Item color={textColor} label={lstrings.settings_minutes} value="minutes" />
          <Picker.Item color={textColor} label={lstrings.settings_hours} value="hours" />
          <Picker.Item color={textColor} label={lstrings.settings_days} value="days" />
        </Picker>
      </View>
      <ButtonsContainer primary={{ label: lstrings.string_save, onPress: handleDone }} layout="column" />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  androidAdjust: {
    top: -1
  },
  picker: {
    flex: 1
  },
  pickerContainer: {
    flexDirection: 'row'
  },
  text: {
    color: theme.primaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false
  }
}))
