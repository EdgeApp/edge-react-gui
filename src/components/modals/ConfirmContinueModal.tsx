import * as React from 'react'
import { ScrollView, TouchableWithoutFeedback, View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import Feather from 'react-native-vector-icons/Feather'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'
import { ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'

interface Props {
  bridge: AirshipBridge<boolean>
  children?: React.ReactNode

  body?: string
  isSkippable?: boolean
  title?: string

  // Add a border:
  warning?: boolean

  // The modal will show a spinner as long as this promise is pending.
  // Returning true will dismiss the modal,
  // but returning false will leave the modal up.
  // Errors go to the drop-down alert.
  onPress?: () => Promise<boolean>
}

export function ConfirmContinueModal(props: Props) {
  const { bridge, body, children, isSkippable = false, title, warning, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const [isAgreed, setAgreed] = React.useState(false)
  const handleTogggle = () => setAgreed(!isAgreed)

  const handleClose = () => bridge.resolve(false)
  const handleAgreed = async () => {
    if (!isAgreed) return
    if (onPress == null) return bridge.resolve(true)
    const result = await onPress()
    if (result) bridge.resolve(true)
  }

  return (
    <ThemedModal bridge={bridge} closeButton={isSkippable} warning={warning} onCancel={handleClose}>
      {title != null && (
        <View style={styles.headerContainer}>
          <Ionicons name="warning" size={theme.rem(1.75)} color={theme.warningIcon} />
          <ModalTitle>{title}</ModalTitle>
        </View>
      )}
      <ScrollView>
        {children}
        {body != null ? <ModalMessage>{body}</ModalMessage> : null}
        <ModalMessage>{lstrings.confirm_continue_modal_body}</ModalMessage>
        <TouchableWithoutFeedback onPress={handleTogggle}>
          <View style={styles.checkBoxContainer}>
            <EdgeText style={styles.checkboxText}>{lstrings.confirm_continue_modal_button_text}</EdgeText>
            <View style={[styles.checkCircleContainer, isAgreed ? styles.checkCircleContainerAgreed : undefined]}>
              {isAgreed && <Feather name="check" color={theme.iconTappable} size={theme.rem(0.75)} accessibilityHint={lstrings.check_icon_hint} />}
            </View>
          </View>
        </TouchableWithoutFeedback>
        <Fade visible={isAgreed}>
          <MainButton alignSelf="center" label={lstrings.confirm_finish} marginRem={0.5} type="secondary" onPress={handleAgreed} />
        </Fade>
      </ScrollView>
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5)
  },
  checkBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.rem(0.5),
    marginVertical: theme.rem(1),
    padding: theme.rem(1),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.defaultBorderColor,
    borderRadius: theme.cardBorderRadius
  },
  checkCircleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.rem(1.25),
    height: theme.rem(1.25),
    borderWidth: theme.thinLineWidth,
    borderColor: theme.icon,
    borderRadius: theme.rem(0.75)
  },
  checkCircleContainerAgreed: {
    borderColor: theme.iconTappable
  },
  checkboxText: {
    flex: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75)
  }
}))
