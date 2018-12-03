// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import { SecondaryModalConnector as SecondaryModal } from '../../connectors/SecondaryModalConnector.js'

type Props = {
  onPrivateKeyAccept: () => void,
  onPrivateKeyReject: () => void,
  reset: () => void
}
export class PrivateKeyModal extends Component<Props> {
  render () {
    const { reset } = this.props
    return (
      <View>
        <SecondaryModal onModalHide={reset} />
      </View>
    )
  }
}

export default PrivateKeyModal
