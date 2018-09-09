// @flow

import React, { Component } from 'react'
import slowlog from 'react-native-slowlog'

import * as Constants from '../../../../../constants/indexConstants'
import s from '../../../../../locales/strings'
import type { State } from '../../../../ReduxTypes'
import { TextAndIconButton } from '../../Buttons/TextAndIconButton.ui'
import { walletSelectorStyles } from '../style'
import { WalletNameHeader } from './WalletNameHeader.ui.js'

export type StateProps = {
  selectedWalletName: string | null,
  selectedWalletCurrencyCode: string
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
    let title = s.strings.loading
    if (this.props.selectedWalletName) {
      const selectedWalletName = this.props.selectedWalletName
      const selectedWalletCurrencyCode = this.props.selectedWalletCurrencyCode
      title = function HeaderComp (styles) {
        return <WalletNameHeader name={selectedWalletName} denomination={selectedWalletCurrencyCode} styles={styles} />
      }
    }

    return (
      <TextAndIconButton
        style={walletSelectorStyles}
        icon={Constants.KEYBOARD_ARROW_DOWN}
        iconType={Constants.MATERIAL_ICONS}
        onPress={this.props.onPress}
        title={title}
      />
    )
  }
}
