// @flow
/* eslint "react/jsx-sort-props": ["error", { "callbacksLast": true }] */

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { PrimaryButton } from '../themed/PrimaryButton.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type ButtonInfo = {|
  label: string,
  outlined?: boolean
|}

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
  buttons: Buttons,
  disableHideOnTapUnderlay?: boolean
}) {
  const { bridge, closeButton, title, message, children, buttons, disableHideOnTapUnderlay = false } = props

  return (
    <ThemedModal bridge={bridge} paddingRem={1} onCancel={disableHideOnTapUnderlay ? () => {} : () => bridge.resolve(undefined)}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      {message != null ? <ModalMessage>{message}</ModalMessage> : null}
      {children}
      {Object.keys(buttons).map(key => {
        const { label, outlined = false } = buttons[key]
        return <PrimaryButton key={key} label={label} marginRem={0.5} outlined={outlined} onPress={() => bridge.resolve(key)} />
      })}
      {closeButton ? <ModalCloseArrow onPress={() => bridge.resolve(undefined)} /> : undefined}
    </ThemedModal>
  )
}
