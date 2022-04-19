// @flow

import * as React from 'react'
import { Text, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import s from '../../locales/strings.js'
import { textStyle } from '../../styles/common/textStylesThemed.js'
import { AirshipDropdown } from '../common/AirshipDropdown.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {
  bridge: AirshipBridge<void>,
  message: string,

  // True for orange warning, false for red alert:
  warning?: boolean
}

export function AlertDropdown(props: Props) {
  const { bridge, message, warning } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const color = warning ? theme.dropdownWarning : theme.dropdownError

  return (
    <AirshipDropdown bridge={bridge} backgroundColor={color}>
      <View style={styles.container}>
        <EntypoIcon name="warning" size={theme.rem(1)} style={styles.icon} />
        <Text style={styles.text}>
          <Text style={styles.textBold}>{warning ? s.strings.alert_dropdown_warning : s.strings.alert_dropdown_alert}</Text>
          {message}
        </Text>
        <AntDesignIcon name="closecircle" size={theme.rem(1)} style={styles.icon} />
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
