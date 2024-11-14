import * as React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { textStyle } from '../../styles/common/textStylesThemed'
import { AirshipDropdown } from '../common/AirshipDropdown'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  bridge: AirshipBridge<void>
  message: string

  /** True for orange warning, false for red alert: */
  warning?: boolean

  /** No auto-hide, must dismiss through the tap. */
  persistent?: boolean

  /** If given, pressing the body of the dropdown invokes onPress, while the
   * close icon dismisses the dropdown */
  onPress?: () => void | Promise<void>
}

export function AlertDropdown(props: Props) {
  const { bridge, persistent, message, warning, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const color = warning ? theme.dropdownWarning : theme.dropdownError

  const handleOnPress = useHandler(async () => {
    if (onPress != null) await onPress()
    bridge.resolve()
  })

  const handleClose = useHandler(() => {
    bridge.resolve()
  })

  return (
    <AirshipDropdown autoHideMs={persistent ? 0 : undefined} bridge={bridge} backgroundColor={color}>
      <View style={styles.container}>
        <EdgeTouchableOpacity style={styles.content} onPress={handleOnPress}>
          <EntypoIcon name="warning" size={theme.rem(1)} style={styles.icon} />
          <Text style={styles.text}>
            <Text style={styles.textBold}>{warning ? lstrings.alert_dropdown_warning : lstrings.alert_dropdown_alert}</Text>
            {message}
          </Text>
        </EdgeTouchableOpacity>
        <EdgeTouchableOpacity onPress={handleClose}>
          <AntDesignIcon name="closecircle" size={theme.rem(1)} style={styles.icon} />
        </EdgeTouchableOpacity>
      </View>
    </AirshipDropdown>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    flexDirection: 'row',

    justifyContent: 'space-between',
    padding: theme.rem(0.5)
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  text: {
    ...textStyle(theme, 'row-center', 'small'),
    color: theme.dropdownText,
    padding: theme.rem(0.25)
  },
  textBold: {
    fontFamily: theme.fontFaceBold
  },
  icon: {
    color: theme.icon,
    minWidth: theme.rem(1.5),
    textAlign: 'center'
  }
}))
