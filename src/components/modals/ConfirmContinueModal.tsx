import * as React from 'react'
import { View } from 'react-native'
import { AirshipBridge } from 'react-native-airship'
import Feather from 'react-native-vector-icons/Feather'
import Ionicons from 'react-native-vector-icons/Ionicons'

import { lstrings } from '../../locales/strings'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'
import { ModalTitle } from '../themed/ModalParts'
import { EdgeModal } from './EdgeModal'

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
    <EdgeModal
      bridge={bridge}
      warning={warning}
      title={
        // TODO: warning icon should be part of ModalUi4
        title == null ? null : (
          <ModalTitle icon={warning == null ? null : <Ionicons name="warning" size={theme.rem(1.75)} color={theme.warningIcon} />}>{title}</ModalTitle>
        )
      }
      scroll
      onCancel={isSkippable ? handleClose : undefined}
    >
      {children}
      {body != null ? <Paragraph>{body}</Paragraph> : null}
      <Paragraph>{lstrings.confirm_continue_modal_body}</Paragraph>
      <EdgeTouchableWithoutFeedback onPress={handleTogggle}>
        <View style={styles.checkBoxContainer}>
          <EdgeText style={styles.checkboxText}>{lstrings.confirm_continue_modal_button_text}</EdgeText>
          <View style={[styles.checkCircleContainer, isAgreed ? styles.checkCircleContainerAgreed : undefined]}>
            {isAgreed && <Feather name="check" color={theme.iconTappable} size={theme.rem(0.75)} accessibilityHint={lstrings.check_icon_hint} />}
          </View>
        </View>
      </EdgeTouchableWithoutFeedback>
      <Fade visible={isAgreed}>
        <MainButton label={lstrings.confirm_finish} marginRem={1} type="primary" onPress={handleAgreed} />
      </Fade>
    </EdgeModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
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
