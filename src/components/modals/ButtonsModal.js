// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { showError } from '../services/AirshipInstance.js'
import { MainButton } from '../themed/MainButton.js'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type ButtonInfo = {
  label: string,
  type?: 'primary' | 'secondary',

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
  disableCancel?: boolean
|}) {
  const { bridge, title, message, children, buttons, closeArrow = false, disableCancel = false } = props

  const handleCancel = disableCancel ? () => {} : () => bridge.resolve(undefined)

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={handleCancel}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      {message != null ? <ModalMessage>{message}</ModalMessage> : null}
      {children}
      {Object.keys(buttons).map(key => {
        const { type = 'primary', label, onPress } = buttons[key]

        const handlePress = (): void | Promise<void> => {
          if (onPress == null) return bridge.resolve(key)
          return onPress().then(
            result => {
              if (result) bridge.resolve(key)
            },
            error => showError(error)
          )
        }

        return <MainButton key={key} label={label} marginRem={0.5} type={type} onPress={handlePress} />
      })}
      {closeArrow ? <ModalCloseArrow onPress={handleCancel} /> : null}
    </ThemedModal>
  )
}
