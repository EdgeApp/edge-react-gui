// @flow

import React, { Component } from 'react'
import { View } from 'react-native'

import styles from '../../styles/scenes/WalletListStyle'
import { FormField } from './FormField.js'

type Props = {
  currentWalletBeingRenamed: string,
  updateRenameWalletInput: string => any,
  walletName: string,
  label: string
}

type State = {
  currentWalletNameInput: string
}

export default class WalletNameInput extends Component<Props, State> {
  constructor (props: Props) {
    super(props)
    this.state = {
      currentWalletNameInput: props.walletName
    }
  }

  _onNameInputChange = (input: string) => {
    // be aware that walletListRowOptions.ui.js also initially dispatches this action
    this.props.updateRenameWalletInput(input)
    this.setState({ currentWalletNameInput: input })
  }

  render () {
    return (
      <View style={[styles.nameInputWrap]}>
        <FormField
          autoCapitalize="words"
          style={[styles.nameInput]}
          onChangeText={this._onNameInputChange}
          value={this.state.currentWalletNameInput}
          label={this.props.label}
          autoFocus
        />
      </View>
    )
  }
}
