import * as React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { AirshipDropdown } from '../common/AirshipDropdown'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { Paragraph } from '../themed/EdgeText'

interface Props {
  bridge: AirshipBridge<void>
  message: string
  icon?: React.ReactNode
  onPress?: () => void
}

export function FlashNotification(props: Props) {
  const { bridge, message, icon, onPress = () => {} } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  return (
    <AirshipDropdown bridge={bridge} backgroundColor={theme.modal} onPress={onPress}>
      <View style={styles.container}>
        {icon ?? <AntDesignIcon name="checkcircle" size={theme.rem(2)} style={styles.icon} />}
        <Paragraph center>{message}</Paragraph>
      </View>
    </AirshipDropdown>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    margin: theme.rem(0.5),
    alignItems: 'center'
  },
  icon: {
    alignSelf: 'center',
    color: theme.iconTappable,
    margin: theme.rem(0.5)
  }
}))
