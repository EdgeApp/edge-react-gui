// @flow

import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import EntypoIcon from 'react-native-vector-icons/Entypo'

import s from '../../locales/strings.js'
import { B, nightText } from '../../styles/common/textStyles.js'
import { THEME, getHeaderHeight } from '../../theme/variables/airbitz.js'
import { type AirshipBridge } from '../common/Airship.js'
import { AirshipDropdown } from '../common/AirshipDropdown.js'

type Props = {
  bridge: AirshipBridge<void>,
  message: string,

  // True for orange warning, false for red alert:
  warning?: boolean
}

export function AlertDropdown (props: Props) {
  const { bridge, message, warning } = props

  return (
    <AirshipDropdown bridge={bridge} backgroundColor={warning ? THEME.COLORS.ACCENT_ORANGE : THEME.COLORS.ACCENT_RED}>
      <View style={styles.container}>
        <EntypoIcon name="warning" size={THEME.rem(1.4)} style={styles.icon} />
        <Text style={styles.text}>
          <B>{warning ? s.strings.alert_dropdown_warning : s.strings.alert_dropdown_alert}</B>
          {message}
        </Text>
        <AntDesignIcon name="closecircle" size={THEME.rem(1)} style={styles.icon} />
      </View>
    </AirshipDropdown>
  )
}

const padding = THEME.rem(1 / 2)

const styles = StyleSheet.create({
  container: {
    minHeight: getHeaderHeight(),
    padding,

    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  icon: {
    color: THEME.COLORS.WHITE,
    textAlign: 'center',
    minWidth: THEME.rem(1.4)
  },

  text: {
    ...nightText('row-left', 'small'),
    marginHorizontal: padding
  }
})
