// @flow

import React from 'react'

import { Airship } from '../services/AirshipInstance'
import { ModalCloseArrow, ModalMessage, ModalTitle } from '../themed/ModalParts'
import { ThemedModal } from '../themed/ThemedModal'
import { type AirshipBridge } from './modalParts'

export function showInfoModal(title: string, message: string): Promise<mixed> {
  return Airship.show(bridge => <InfoModal bridge={bridge} title={title} message={message} />)
}

type Props = {
  bridge: AirshipBridge<void>,
  title: string,
  message: string
}

class InfoModal extends React.Component<Props> {
  handleClose = () => this.props.bridge.resolve()

  render() {
    const { bridge, title, message } = this.props

    return (
      <ThemedModal bridge={bridge} onCancel={this.handleClose} paddingRem={1}>
        <ModalTitle>{title}</ModalTitle>
        <ModalMessage>{message}</ModalMessage>
        <ModalCloseArrow onPress={this.handleClose} />
      </ThemedModal>
    )
  }
}
