import * as React from 'react'
import { Text } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { nightText } from '../../styles/common/textStyles'
import { AirshipDropdown } from '../common/AirshipDropdown'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  bridge: AirshipBridge<void>
  message: string
  onPress?: () => void
}

export function FlashNotification(props: Props) {
  const { bridge, message, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  return (
    <AirshipDropdown bridge={bridge} backgroundColor={theme.modal} onPress={onPress}>
      <AntDesignIcon name="checkcircle" size={theme.rem(2)} style={styles.icon} />
      <Text style={styles.text}>{message}</Text>
    </AirshipDropdown>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  text: {
    // @ts-expect-error
    ...nightText('row-center'),
    padding: theme.rem(0.25)
  },
  icon: {
    alignSelf: 'center',
    color: theme.iconTappable,
    paddingTop: theme.rem(0.25)
  }
}))
