// @flow

import * as React from 'react'
import { TouchableWithoutFeedback, View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'
import Feather from 'react-native-vector-icons/Feather'
import Ionicons from 'react-native-vector-icons/Ionicons'

import s from '../../locales/strings.js'
import { useState } from '../../types/reactHooks.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { EdgeText } from '../themed/EdgeText.js'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type Props = {|
  bridge: AirshipBridge<boolean>,
  body?: string,
  isSkippable?: boolean,
  title?: string
|}

export function ConfirmContinueModal(props: Props) {
  const theme = useTheme()
  const styles = getStyles(theme)

  const { bridge, body, isSkippable, title } = props
  const [isAgreed, setAgreed] = useState(false)
  const toggleIsAgreed = () => setAgreed(!isAgreed)
  const handleClose = () => (isSkippable ? bridge.resolve(false) : undefined)
  const handleAgreed = () => (isAgreed ? bridge.resolve(true) : undefined)

  return (
    <ThemedModal bridge={bridge} onCancel={handleClose}>
      {title != null && (
        <View style={styles.headerContainer}>
          <Ionicons name="warning" size={theme.rem(1.75)} color={theme.warningIcon} />
          <ModalTitle>{title}</ModalTitle>
        </View>
      )}
      {body != null ? <ModalMessage>{body}</ModalMessage> : null}
      <ModalMessage>{s.strings.confirm_continue_modal_body}</ModalMessage>
      <TouchableWithoutFeedback onPress={toggleIsAgreed}>
        <View style={styles.checkBoxContainer}>
          <EdgeText style={styles.checkboxText}>{s.strings.confirm_continue_modal_button_text}</EdgeText>
          <View style={[styles.checkCircleContainer, isAgreed ? styles.checkCircleContainerAgreed : undefined]}>
            {isAgreed && <Feather name="check" color={theme.iconTappable} size={theme.rem(0.75)} />}
          </View>
        </View>
      </TouchableWithoutFeedback>
      <Fade visible={isAgreed}>
        <MainButton alignSelf="center" label={s.strings.confirm_finish} marginRem={0.5} type="secondary" onPress={handleAgreed} />
      </Fade>
      {isSkippable && <ModalCloseArrow onPress={handleClose} />}
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
