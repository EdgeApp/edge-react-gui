// @flow

import React, { Component } from 'react'

import ProgressBar from '../../../../components/ProgressBar/ProgressBar.ui.js'

export type WalletListProgressBarOwnProps = {}

export type WalletListProgressBarStateProps = {
  progressPercentage: number
}

export type WalletListProgressBarDispatchProps = {}

export type WalletListProgressBarProps = WalletListProgressBarOwnProps & WalletListProgressBarStateProps & WalletListProgressBarDispatchProps

export type WalletListProgressBarState = {
  isWalletProgressVisible: boolean
}

export class WalletListProgressBarComponent extends Component<WalletListProgressBarProps, WalletListProgressBarState> {
  constructor (props: WalletListProgressBarProps) {
    super(props)
    this.state = {
      isWalletProgressVisible: true
    }
  }

  render () {
    if (this.props.progressPercentage === 100) {
      setTimeout(() => {
        this.setState({
          isWalletProgressVisible: false
        })
      }, 2000)
    }
    if (this.state.isWalletProgressVisible) {
      return <ProgressBar progress={this.props.progressPercentage} />
    }
    return null
  }
}
