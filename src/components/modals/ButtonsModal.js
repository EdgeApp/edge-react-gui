// @flow

import * as React from 'react'
import { type AirshipBridge } from 'react-native-airship'

import { ModalMessage, ModalTitle } from '../themed/ModalParts.js'
import { PrimaryButton, SecondaryButton } from '../themed/ThemedButtons.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type ButtonInfo = {
  label: string,
  type?: 'primary' | 'secondary'
}

export function ButtonsModal<Buttons: { [key: string]: ButtonInfo }>(props: {
  bridge: AirshipBridge<$Keys<Buttons> | void>,
  title?: string,
  message?: string,
  buttons: Buttons
}) {
  const { bridge, title, message, buttons } = props

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(undefined)} paddingRem={1}>
      {title != null ? <ModalTitle>{title}</ModalTitle> : null}
      {message != null ? <ModalMessage>{message}</ModalMessage> : null}
      {Object.keys(buttons).map(key => {
        const { label, type = 'primary' } = buttons[key]

        switch (type) {
          case 'primary':
            return <PrimaryButton key={key} label={label} onPress={() => bridge.resolve(key)} marginRem={0.5} />
          case 'secondary':
            return <SecondaryButton key={key} label={label} onPress={() => bridge.resolve(key)} marginRem={0.5} />
        }
      })}
    </ThemedModal>
  )
}
