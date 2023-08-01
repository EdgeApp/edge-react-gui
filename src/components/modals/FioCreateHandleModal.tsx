import * as React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getFioNewHandleImage } from '../../util/CdnUris'
import { parseMarkedText } from '../../util/parseMarkedText'
import { styled } from '../hoc/styled'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ThemedModal } from '../themed/ThemedModal'

interface Props {
  bridge: AirshipBridge<boolean>
  createWalletsPromise?: Promise<void>
}

export const FioCreateHandleModal = (props: Props) => {
  const { bridge, createWalletsPromise } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const [showPleaseWait, setShowPleaseWait] = React.useState(false)

  const handleCancel = useHandler(() => {
    bridge.resolve(false)
  })

  const handleConfirm = useHandler(async () => {
    if (createWalletsPromise != null) {
      setShowPleaseWait(true)
      await createWalletsPromise
    }
    bridge.resolve(true)
  })

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <View style={styles.container}>
        <FastImage source={{ uri: getFioNewHandleImage(theme) }} style={styles.icon} />
        <GetFioHandleTitle>{parseMarkedText(lstrings.fio_free_handle_title_m)}</GetFioHandleTitle>
        <EdgeText style={styles.message} numberOfLines={4} disableFontScaling>
          {lstrings.fio_free_handle_congrats}
        </EdgeText>
        <EdgeText style={styles.message} numberOfLines={8} disableFontScaling>
          {lstrings.fio_free_handle_message}
        </EdgeText>
      </View>
      {showPleaseWait ? (
        <EdgeText style={styles.waitMessage} numberOfLines={3}>
          {lstrings.fio_free_handle_please_wait}
        </EdgeText>
      ) : null}
      <MainButton type="primary" label={lstrings.get_started_button} onPress={handleConfirm} marginRem={[1, 1, 0.5, 1]} />
      <MainButton type="escape" label={lstrings.not_now_button} onPress={handleCancel} marginRem={[0.5, 1, 1, 1]} />
    </ThemedModal>
  )
}

const GetFioHandleTitle = styled(Text)(theme => ({
  color: theme.primaryText,
  fontSize: theme.rem(1.75),
  fontFamily: theme.fontFaceDefault,
  fontWeight: 'bold',
  marginBottom: theme.rem(1),
  textAlign: 'center'
}))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.rem(1),
    paddingVertical: theme.rem(3)
  },
  icon: {
    width: theme.rem(10),
    height: theme.rem(10),
    marginBottom: theme.rem(1)
  },
  title: {
    color: theme.primaryText,
    fontSize: theme.rem(1.75),
    fontWeight: 'bold',
    marginBottom: theme.rem(1),
    textAlign: 'center'
  },
  message: {
    fontSize: theme.rem(1),
    textAlign: 'center'
  },
  waitMessage: {
    fontSize: theme.rem(0.75),
    textAlign: 'center',
    fontColor: theme.secondaryText
  },
  button: {
    paddingHorizontal: theme.rem(1)
  }
}))
