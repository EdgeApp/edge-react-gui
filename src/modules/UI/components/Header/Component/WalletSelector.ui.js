// @flow

import React, {Component} from 'react'
import type {State} from '../../../../ReduxTypes'
import {TextAndIconButton} from '../../Buttons/TextAndIconButton.ui'
import * as Constants from '../../../../../constants/indexConstants'
import { CryptoExchangeSceneStyle } from '../../../../../styles/scenes/CryptoExchangeSceneStyles'

export type StateProps = {
  title: string
}

export type DispatchProps = {
  onPress: () => any
}

type Props = StateProps & DispatchProps

export default class WalletSelector extends Component<Props, State> {
  render () {
    return <TextAndIconButton
      style={CryptoExchangeSceneStyle.flipWrapper.walletSelector}
      icon={Constants.KEYBOARD_ARROW_DOWN}
      iconType={Constants.MATERIAL_ICONS}
      onPress={this.props.onPress}
      title={this.props.title}
    />
  }
}
