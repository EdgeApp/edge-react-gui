// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import GetSeedModal from '../../connectors/GetSeedModalConnector'
import RenameModal from '../../connectors/RenameModalConnector'
import XPubModal from '../../connectors/XPubModalConnector.js'

type Props = any
type State = any

export default class WalletOptions extends Component<Props, State> {
  render () {
    return (
      <View>
        <RenameModal />
        <GetSeedModal />
        <XPubModal />
      </View>
    )
  }
}
