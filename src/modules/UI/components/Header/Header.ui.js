// @flow

import React, { Component } from 'react'

import WalletSelector from './Component/WalletSelectorConnector'

type Props = {}

export default class Header extends Component<Props> {
  render () {
    return <WalletSelector />
  }
}
