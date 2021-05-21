// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { PrimaryButton, SecondaryButton } from '../themed/ThemedButtons.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type ButtonInfo = {
  label: string,
  type?: 'primary' | 'secondary'
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
export function ButtonsModal<Buttons: { [key: string]: ButtonInfo }>(props: {
  bridge: AirshipBridge<$Keys<Buttons> | void>,
  title?: string,
  message?: string,
  children?: React.Node,
  closeButton?: boolean,
  buttons: Buttons
}) {
  const { bridge, closeButton, title, message, children, buttons } = props

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(undefined)} paddingRem={1}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      {message != null ? <ModalMessage>{message}</ModalMessage> : null}
      {children}
      {Object.keys(buttons).map(key => {
        const { label, type = 'primary' } = buttons[key]

        switch (type) {
          case 'primary':
            return <PrimaryButton key={key} label={label} onPress={() => bridge.resolve(key)} marginRem={0.5} />
          case 'secondary':
            return <SecondaryButton key={key} label={label} onPress={() => bridge.resolve(key)} marginRem={0.5} />
        }
      })}
      {closeButton ? <ModalCloseArrow onPress={() => bridge.resolve(undefined)} /> : undefined}
    </ThemedModal>
  )
}
