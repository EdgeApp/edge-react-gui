// @flow

import { useCavy } from 'cavy'
import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { View } from '../../types/reactNative.js'
import { showError } from '../services/AirshipInstance.js'
import { useTheme } from '../services/ThemeContext.js'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

export type ButtonInfo = {
  label: string,
  type?: 'primary' | 'secondary' | 'escape',

  // The modal will show a spinner as long as this promise is pending.
  // Returning true will dismiss the modal,
  // but returning false will leave the modal up.
  // Although multiple buttons can be spinning at once,
  // a spinning button cannot be clicked again until the promise resolves.
  onPress?: () => Promise<boolean>
}

/**
 * A modal with a title, message, and buttons.
 * This is an alternative to the native `Alert` component.
 *
 * Child components appear between the message and the buttons,
 * but this feature is only meant for inserting extra message elements,
 * like images or custom text formatting.
 *
 * Build a custom modal component if you need form fields, check boxes,
 * or other interactive elements.
 */
export function ButtonsModal<Buttons: { [key: string]: ButtonInfo }>(props: {|
  bridge: AirshipBridge<$Keys<Buttons> | void>,
  title?: string,
  message?: string,
  children?: React.Node,
  buttons: Buttons,
  closeArrow?: boolean,
  disableCancel?: boolean,
  fullScreen?: boolean
|}) {
  const { bridge, title, message, children, buttons, closeArrow = false, disableCancel = false, fullScreen = false } = props
  const theme = useTheme()

  const handleCancel = disableCancel ? () => {} : () => bridge.resolve(undefined)
  const generateTestHook = useCavy()
  const styles = {
    container: {
      flex: fullScreen ? 1 : 0
    },
    text: {
      justifyContent: 'flex-start'
    },
    buttons: {
      justifyContent: 'flex-end'
    }
  }

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={handleCancel}>
      <View style={styles.container}>
        <View style={styles.text}>
          {title != null ? <ModalTitle>{title}</ModalTitle> : null}
          {message != null ? <ModalMessage>{message}</ModalMessage> : null}
          {children}
        </View>
      </View>
      <View style={styles.buttons}>
        {Object.keys(buttons).map((key, i, arr) => {
          let defaultType
          if (theme.preferPrimaryButton) {
            defaultType = i === 0 ? 'primary' : 'secondary'
          } else {
            defaultType = i === 0 && arr.length > 1 ? 'primary' : 'secondary'
          }
          const { type = defaultType, label, onPress } = buttons[key]

          const handlePress = (): void | Promise<void> => {
            if (onPress == null) return bridge.resolve(key)
            return onPress().then(
              result => {
                if (result) bridge.resolve(key)
              },
              error => showError(error)
            )
          }

          return <MainButton key={key} label={label} marginRem={0.5} type={type} onPress={handlePress} ref={generateTestHook('ButtonsModal.Close')} />
        })}
        {closeArrow ? <ModalCloseArrow onPress={handleCancel} /> : null}
      </View>
    </ThemedModal>
  )
}
