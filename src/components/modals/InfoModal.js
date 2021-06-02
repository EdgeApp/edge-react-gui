// @flow

import React from 'react'

import { Airship } from '../services/AirshipInstance'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'
import { type AirshipBridge } from './modalParts'

export function showInfoModal(title: string, message: string | string[]): Promise<mixed> {
  return Airship.show(bridge => <InfoModal bridge={bridge} title={title} message={message} />)
}

type Props = {
  bridge: AirshipBridge<void>,
  title: string,
  message: string | string[]
}

class InfoModal extends React.Component<Props> {
  handleClose = () => this.props.bridge.resolve()

  render() {
    const { bridge, title, message } = this.props

    let preparedMessage = <ModalMessage>{message}</ModalMessage>

    if (Array.isArray(message)) {
      preparedMessage = (
        <>
          {message.map(message => (
            <ModalMessage key={message}>{message}</ModalMessage>
          ))}
        </>
      )
    }

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={1}>
        <ModalTitle>{title}</ModalTitle>
        {preparedMessage}
        <ModalCloseArrow onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}
