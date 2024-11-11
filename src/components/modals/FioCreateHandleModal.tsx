import * as React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { getUi4ImageUri } from '../../util/CdnUris'
import { parseMarkedText } from '../../util/parseMarkedText'
import { ButtonsView } from '../buttons/ButtonsView'
import { styled } from '../hoc/styled'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { EdgeModal } from './EdgeModal'

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
    <EdgeModal bridge={bridge} onCancel={handleCancel}>
      <View style={styles.container}>
        <FastImage source={{ uri: getUi4ImageUri(theme, 'fio/newHandle') }} style={styles.icon} resizeMode={FastImage.resizeMode.contain} />
        <GetFioHandleTitle numberOfLines={1} adjustsFontSizeToFit>
          {parseMarkedText(lstrings.fio_free_web3_handle_title_m)}
        </GetFioHandleTitle>
        <EdgeText style={styles.message} numberOfLines={8} disableFontScaling>
          {lstrings.fio_free_web3_handle_message}
        </EdgeText>
      </View>
      {showPleaseWait ? (
        <EdgeText style={styles.waitMessage} numberOfLines={3}>
          {lstrings.fio_free_handle_please_wait}
        </EdgeText>
      ) : null}
      <ButtonsView
        primary={{ label: lstrings.get_started_button, onPress: handleConfirm }}
        secondary={{ label: lstrings.not_now_button, onPress: handleCancel }}
        layout="column"
      />
    </EdgeModal>
  )
}

const GetFioHandleTitle = styled(Text)(theme => ({
  color: theme.primaryText,
  fontSize: theme.rem(1.75),
  fontFamily: theme.fontFaceDefault,
  marginBottom: theme.rem(2),
  textAlign: 'center'
}))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    paddingHorizontal: theme.rem(0.5),
    paddingBottom: theme.rem(0.5)
  },
  icon: {
    width: theme.rem(15),
    height: theme.rem(15),
    marginBottom: theme.rem(1.5),
    marginTop: -theme.rem(1), // Take up some of the modal title area
    flexShrink: 1
  },
  message: {
    fontSize: theme.rem(1),
    textAlign: 'center',
    marginBottom: theme.rem(0.5)
  },
  waitMessage: {
    marginTop: theme.rem(1),
    marginBottom: theme.rem(0.5),
    fontSize: theme.rem(0.75),
    textAlign: 'center',
    fontColor: theme.secondaryText
  },
  button: {
    paddingHorizontal: theme.rem(1)
  }
}))
