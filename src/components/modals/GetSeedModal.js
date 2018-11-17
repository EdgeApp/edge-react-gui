// @flow

import { type EdgeCurrencyWallet } from 'edge-core-js'
import React, { Component } from 'react'
import { StyleSheet, View } from 'react-native'

import * as Constants from '../../constants/indexConstants.js'
import s from '../../locales/strings.js'
import T from '../../modules/UI/components/FormattedText/FormattedText.ui'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
import OptionButtons from '../../modules/UI/components/OptionButtons/OptionButtons.ui.js'
import OptionIcon from '../../modules/UI/components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../modules/UI/components/OptionSubtext/OptionSubtextConnector.js'
import { ConfirmPasswordModalStyle, MaterialInputOnWhite } from '../../styles/indexStyles'
import styles from '../../styles/scenes/WalletListStyle'
import { FormField } from '../indexComponents'

export const GET_SEED_WALLET_START = 'GET_SEED_WALLET_START'
export const GET_SEED_WALLET_SUCCESS = 'GET_SEED_WALLET_SUCCESS'

export type GetSeedModalStateProps = {
  privateSeedUnlocked: boolean,
  wallet: EdgeCurrencyWallet,
  walletName: string,
  visibilityBoolean: boolean
}

export type GetSeedModalDispatchProps = {
  onExitButtonFxn: () => void,
  onPositive: (password: string) => any,
  onNegative: () => any,
  onDone: () => any
}

type GetSeedModalComponentProps = GetSeedModalStateProps & GetSeedModalDispatchProps

type State = {
  confimPassword: string,
  error: string
}

export default class GetSeed extends Component<GetSeedModalComponentProps, State> {
  UNSAFE_componentWillMount () {
    this.setState(() => ({ confimPassword: '', error: '' }))
  }

  UNSAFE_componentWillReceiveProps () {
    if (this.props.privateSeedUnlocked) {
      this.setState(() => ({ confimPassword: '', error: '' }))
    }
  }

  textChange = (value: string) => {
    this.setState(() => {
      return { confimPassword: value }
    })
  }

  onDone = () => {
    this.props.onDone()
    this.setState(() => ({ confimPassword: '', error: '' }))
  }

  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
    this.setState(() => ({ confimPassword: '', error: '' }))
  }

  onPositive = () => {
    const currentPassword = this.state.confimPassword
    this.props.onPositive(currentPassword)
    this.setState(() => ({
      confimPassword: '',
      error: this.props.privateSeedUnlocked ? '' : s.strings.fragmet_invalid_password
    }))
  }

  onDismiss = () => {
    this.onDone()
    this.props.onExitButtonFxn()
  }

  renderPasswordInput = (style?: StyleSheet.Styles) => {
    const formStyle = {
      ...MaterialInputOnWhite,
      container: { ...MaterialInputOnWhite.container }
    }
    return (
      <View style={[ConfirmPasswordModalStyle.middle.container, { paddingTop: 10, paddingBottom: 25 }]}>
        <FormField
          onChangeText={this.textChange}
          style={formStyle}
          label={s.strings.confirm_password_text}
          value={this.state.confimPassword}
          error={this.state.error}
          secureTextEntry
          autoFocus
        />
      </View>
    )
  }

  renderRevealedSeedArea = (seed: string) => {
    return (
      <View style={styles.seedTopLayer}>
        <T style={styles.seedText}>{seed}</T>
      </View>
    )
  }

  render () {
    let modalMiddle = (
      <View style={[styles.container, { flexDirection: 'column' }]}>
        <OptionSubtext
          confirmationText={s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}
          label={s.strings.fragment_wallets_get_seed_wallet}
        />
        {this.renderPasswordInput()}
      </View>
    )

    let modalBottom = <OptionButtons positiveText={s.strings.string_get_seed} onPositive={this.onPositive} onNegative={this.onNegative} />
    if (this.props.privateSeedUnlocked && this.props.wallet != null) {
      const seed = this.props.wallet.getDisplayPrivateSeed() || ''
      modalBottom = null
      modalMiddle = this.renderRevealedSeedArea(seed)
    }

    return (
      <StylizedModal
        featuredIcon={<OptionIcon iconName={Constants.GET_SEED} />}
        headerText={s.strings.fragment_wallets_get_seed_wallet}
        modalMiddle={modalMiddle}
        modalBottom={modalBottom}
        style={styles.getSeedModal}
        visibilityBoolean={this.props.visibilityBoolean}
        onExitButtonFxn={this.onDismiss}
      />
    )
  }
}
