import * as React from 'react'
import { Text, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import FastImage from 'react-native-fast-image'

import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { styled } from '../hoc/styled'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MarkedText } from '../text/MarkedText'
import { EdgeText } from '../themed/EdgeText'
import { MainButton } from '../themed/MainButton'
import { ThemedModal } from '../themed/ThemedModal'

interface Props {
  bridge: AirshipBridge<boolean>
}

export const FioCreateHandleModal = (props: Props) => {
  const { bridge } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const handleCancel = useHandler(() => {
    bridge.resolve(false)
  })

  const handleConfirm = useHandler(() => {
    bridge.resolve(true)
  })

  return (
    <ThemedModal bridge={bridge} onCancel={handleCancel}>
      <View style={styles.container}>
        <FastImage source={{ uri: 'https://content.edge.app/currencyIconsV3/fio/fio_dark.png' }} style={styles.icon} />
        <GetFioHandleTitle>
          <MarkedText>{s.strings.fio_new_account_get_handle_title}</MarkedText>
        </GetFioHandleTitle>
        <EdgeText style={styles.message} numberOfLines={5}>
          {s.strings.fio_new_account_congrats}
        </EdgeText>
        <View style={styles.buttonContainer}>
          <MainButton type="secondary" label="Dismiss" onPress={handleCancel} marginRem={1} />
          <MainButton type="primary" label="Get Started" onPress={handleConfirm} marginRem={1} />
        </View>
      </View>
    </ThemedModal>
  )
}

const GetFioHandleTitle = styled(Text)(props => ({
  color: props.theme.primaryText,
  fontSize: props.theme.rem(1.75),
  fontFamily: props.theme.fontFaceDefault,
  fontWeight: 'bold',
  marginBottom: props.theme.rem(1),
  textAlign: 'center'
}))

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.rem(2),
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
    fontSize: theme.rem(0.75),
    textAlign: 'center'
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.rem(2),
    marginTop: theme.rem(1)
  },
  button: {
    minWidth: theme.rem(10),
    paddingHorizontal: theme.rem(1)
  }
}))
