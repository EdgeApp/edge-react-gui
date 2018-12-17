// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import XPubModal from '../../connectors/XPubModalConnector.js'

type Props = any
type State = any

export default class WalletOptions extends Component<Props, State> {
  render () {
    return (
      <View>
        <XPubModal />
      </View>
    )
  }
}
