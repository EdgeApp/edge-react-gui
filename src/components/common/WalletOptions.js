// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import GetSeedModal from '../../connectors/GetSeedModalConnector'
import XPubModal from '../../connectors/XPubModalConnector.js'

type Props = any
type State = any

export default class WalletOptions extends Component<Props, State> {
  render () {
    return (
      <View>
        <GetSeedModal />
        <XPubModal />
      </View>
    )
  }
}
