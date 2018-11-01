// @flow

import React, { Component } from 'react'

import s from '../../locales/strings.js'
import OptionButtons from '../../modules/UI/components/OptionButtons/OptionButtons.ui.js'

type Props = {
  onPositive: (walletId: string) => void,
  onNegative: () => void,
  onDone: () => void,
  walletId: string
}

export default class SplitWalletButtons extends Component<Props> {
  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
  }
  onPositive = () => {
    this.props.onPositive(this.props.walletId)
    this.props.onDone()
  }

  render () {
    return <OptionButtons positiveText={s.strings.string_split} onPositive={this.onPositive} onNegative={this.onNegative} />
  }
}
