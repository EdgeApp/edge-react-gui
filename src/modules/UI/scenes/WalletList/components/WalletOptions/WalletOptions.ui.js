// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import GetSeedModal from '../GetSeedModal/GetSeedModalConnector'
import RenameModal from '../RenameModal/RenameModalConnector'
import XPubModal from '../XPubModal/XPubModalConnector.js'

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
