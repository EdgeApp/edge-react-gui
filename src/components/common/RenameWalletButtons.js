// @flow

import React, { Component } from 'react'

import s from '../../locales/strings.js'
import OptionButtons from '../../modules/UI/components/OptionButtons/OptionButtons.ui.js'

export type JsxProps = {
  walletName: string
}

export type StateProps = {
  walletId: string,
  renameWalletInput: string,
  walletName: string
}

export type DispatchProps = {
  onPositive: (walletId: string, walletName: string) => any,
  onNegative: () => any,
  onDone: () => any
}

type Props = JsxProps & StateProps & DispatchProps

export default class RenameWalletButtons extends Component<Props> {
  onPositive = () => {
    if (this.props.renameWalletInput) {
      this.props.onPositive(this.props.walletId, this.props.renameWalletInput)
    } else {
      this.props.onPositive(this.props.walletId, this.props.walletName)
    }
    this.props.onDone()
  }

  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
  }

  render () {
    return <OptionButtons positiveText={s.strings.calculator_done} onPositive={this.onPositive} onNegative={this.onNegative} />
  }
}
