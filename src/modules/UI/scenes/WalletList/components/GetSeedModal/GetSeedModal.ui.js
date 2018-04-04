// @flow

import React, { Component } from 'react'
import { Share, StyleSheet, View } from 'react-native'
import { sprintf } from 'sprintf-js'

import { FormField } from '../../../../../../components/indexComponents'
import * as Constants from '../../../../../../constants/indexConstants.js'
import s from '../../../../../../locales/strings.js'
import { ConfirmPasswordModalStyle, MaterialInputOnWhite } from '../../../../../../styles/indexStyles'
import { TertiaryButton } from '../../../../components/Buttons'
import T from '../../../../components/FormattedText/FormattedText.ui'
import StylizedModal from '../../../../components/Modal/Modal.ui'
import OptionButtons from '../../../../components/OptionButtons/OptionButtons.ui.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'
import styles from '../../style'

export const GET_SEED_WALLET_START = 'GET_SEED_WALLET_START'
export const GET_SEED_WALLET_SUCCESS = 'GET_SEED_WALLET_SUCCESS'

type GetSeedModalOwnProps = {
  onPositive: (walletId: string) => void,
  onNegative: () => void,
  onDone: () => void,
  walletId: string,
  visibilityBoolean: boolean,
  onExitButtonFxn: () => void,
  privateSeedUnlocked: boolean
}

export type GetSeedModalStateProps = {
  walletId: string,
  getSeed: () => string | null,
  walletName: string
}

export type GetSeedModalDispatchProps = {
  onPositive: (password: string) => any,
  onNegative: () => any,
  onDone: () => any
}

type GetSeedModalComponentProps = GetSeedModalOwnProps & GetSeedModalStateProps & GetSeedModalDispatchProps

type State = {
  confimPassword: string,
  error: string
}

export default class GetSeed extends Component<GetSeedModalComponentProps, State> {
  componentWillMount () {
    this.setState(() => ({ confimPassword: '', error: '' }))
  }

  componentWillReceiveProps () {
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

  shareSeed = (shareText: string) => {
    const shareTitle = sprintf(s.strings.fragment_wallets_seed_share_title, this.props.walletName)
    Share.share(
      {
        message: shareText,
        title: shareTitle,
        url: undefined
      },
      { dialogTitle: shareTitle }
    )
      .then(() => {
        this.onDismiss()
      })
      .catch(() => {})
  }

  renderRevealedSeedArea = (seed: string) => {
    return (
      <View style={styles.seedTopLayer}>
        <T style={styles.seedText}>{seed}</T>
        <View style={styles.seedSecondLayer}>
          <TertiaryButton onPressFunction={() => this.shareSeed(seed)} text={s.strings.string_share} style={styles.copyButton} />
        </View>
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
    const seed = this.props.getSeed() || ''
    if (this.props.privateSeedUnlocked) {
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
