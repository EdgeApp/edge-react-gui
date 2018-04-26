// @flow

import slowlog from 'react-native-slowlog'
import React, { Component } from 'react'

import * as Constants from '../../../../../constants/indexConstants'
import type { State } from '../../../../ReduxTypes'
import { TextAndIconButton } from '../../Buttons/TextAndIconButton.ui'
import { walletSelectorStyles } from '../style'

export type StateProps = {
  title: string | Function
}

export type DispatchProps = {
  onPress: () => any
}

type Props = StateProps & DispatchProps

export default class WalletSelector extends Component<Props, State> {
  constructor (props: any) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render () {
    return (
      <TextAndIconButton
        style={walletSelectorStyles}
        icon={Constants.KEYBOARD_ARROW_DOWN}
        iconType={Constants.MATERIAL_ICONS}
        onPress={this.props.onPress}
        title={this.props.title}
      />
    )
  }
}
