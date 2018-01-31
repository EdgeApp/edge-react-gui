// @flow

import React, {Component} from 'react'
import {View} from 'react-native'
import {MaterialInputOnWhite, ConfirmPasswordModalStyle} from '../../../../../../styles/indexStyles'
import {FormField} from '../../../../../../components/indexComponents'

import StylizedModal from '../../../../components/Modal/Modal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'

import T from '../../../../components/FormattedText/FormattedText.ui'
import styles from '../../style'
import s from '../../../../../../locales/strings.js'
import OptionButtons from '../../../../components/OptionButtons/OptionButtons.ui.js'

export const GET_SEED_WALLET_START = 'GET_SEED_WALLET_START'
export const GET_SEED_WALLET_SUCCESS = 'GET_SEED_WALLET_SUCCESS'

type Props = {
  onPositive: (walletId: string) => void,
  onNegative: () => void,
  onDone: () => void,
  walletId: string,
  getSeed: any,
  visibilityBoolean: boolean,
  onExitButtonFxn: Function
}

type State = {
  confimPassword: string,
  error: string
}

export default class GetSeed extends Component<Props, State> {
  componentWillMount () {
    this.setState((prevState, props) => ({ confimPassword: '', error: '' }))
  }

  componentWillReceiveProps () {
    if (this.props.privateSeedUnlocked) {
      this.setState((prevState, props) => ({ confimPassword: '', error: '' }))
    }
  }

  textChange = (value: string) => {
    this.setState((prevState, props) => {
      return { confimPassword: value }
    })
  }

  onDone = () => {
    this.props.onDone()
    this.setState((prevState, props) => ({ confimPassword: '', error: '' }))
  }

  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
    this.setState((prevState, props) => ({ confimPassword: '', error: '' }))
  }

  onPositive = () => {
    const currentPassword = this.state.confimPassword
    this.props.onPositive(currentPassword)
    this.setState((prevState, props) => ({
      confimPassword: '',
      error: this.props.privateSeedUnlocked ? '' : s.strings.fragmet_invalid_password
    }))
  }

  renderPasswordInput = (style: any) => {
    const formStyle = {...MaterialInputOnWhite,
      container: {...MaterialInputOnWhite.container}
    }
    return <View style={[ConfirmPasswordModalStyle.middle.container, {paddingTop: 10, paddingBottom: 25}]} >
      <FormField onChangeText={this.textChange}
        style={formStyle}
        label={s.strings.confirm_password_text}
        value={this.state.confimPassword}
        error={this.state.error}
        secureTextEntry
        autoFocus/>
    </View>
  }

  render () {
    let modalMiddle = <View style={[styles.container, {flexDirection: 'column'}]}>
      <OptionSubtext
        confirmationText={s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}
        label={s.strings.fragment_wallets_get_seed_wallet}
      />
      {this.renderPasswordInput()}
    </View>
    let modalBottom = <OptionButtons
      positiveText={s.strings.string_get_seed}
      onPositive={this.onPositive}
      onNegative={this.onNegative}
    />

    if (this.props.privateSeedUnlocked) {
      modalBottom = null
      modalMiddle = <T> {this.props.getSeed()} </T>
    }

    return <StylizedModal
      featuredIcon={<OptionIcon iconName={Constants.GET_SEED}/>}
      headerText={s.strings.fragment_wallets_get_seed_wallet}
      modalMiddle={modalMiddle}
      modalBottom={modalBottom}
      style={styles.getSeedModal}
      visibilityBoolean={this.props.visibilityBoolean}
      onExitButtonFxn={this.props.onExitButtonFxn}
    />
  }
}
