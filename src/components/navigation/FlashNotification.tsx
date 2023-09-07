import * as React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { useHandler } from '../../hooks/useHandler'
import { nightText } from '../../styles/common/textStyles'
import { AirshipDropdown } from '../common/AirshipDropdown'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { ModalFooter } from '../themed/ModalParts'

interface Props {
  bridge: AirshipBridge<void>
  message: string
  onPress?: () => void
}

export function FlashNotification(props: Props) {
  const { bridge, message, onPress = () => {} } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const handleClose = useHandler(() => bridge.resolve())

  return (
    <AirshipDropdown bridge={bridge} backgroundColor={theme.modal} onPress={onPress}>
      <View style={styles.container}>
        <AntDesignIcon name="checkcircle" size={theme.rem(2)} style={styles.icon} />
        <Text style={styles.text}>{message}</Text>
        <ModalFooter onPress={handleClose} />
      </View>
    </AirshipDropdown>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    paddingBottom: theme.rem(1)
  },
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
