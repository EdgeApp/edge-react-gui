// @flow

import React, {Component} from 'react'
import {View, TouchableHighlight} from 'react-native'
import {MaterialInputOnWhite, ConfirmPasswordModalStyle} from '../../../../../../styles/indexStyles'
import {FormField} from '../../../../../../components/indexComponents'
import * as WALLET_API from '../../../../../Core/Wallets/api.js'

import StylizedModal from '../../../../components/Modal/Modal.ui'
import * as Constants from '../../../../../../constants/indexConstants.js'
import OptionIcon from '../../../../components/OptionIcon/OptionIcon.ui'
import OptionSubtext from '../../../../components/OptionSubtext/OptionSubtextConnector.js'

import T from '../../../../components/FormattedText/FormattedText.ui'
import styles from '../../style'
import s from '../../../../../../locales/strings.js'
import OptionButtons from '../../../../components/OptionButtons/OptionButtons.ui.js'

import {
  CLOSE_MODAL_FUNCTION,
  VISIBLE_MODAL_NAME
} from '../WalletOptions/action'

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
  confimPassword: string
}

export default class GetSeed extends Component<Props, State> {
  componentWillMount () {
    this.setState((prevState, props) => ({ confimPassword: '' }))
  }

  textChange = (value: string) => {
    this.setState((prevState, props) => {
      return { confimPassword: value }
    })
  }

  onDone = () => {
    this.props.onDone()
    this.setState((prevState, props) => ({ confimPassword: '' }))
  }

  onNegative = () => {
    this.props.onNegative()
    this.props.onDone()
  }

  onPositive = () => {
    const currentPassword = this.state.confimPassword
    this.setState((prevState, props) => ({ confimPassword: '' }))
    this.props.onPositive(currentPassword)
  }

  renderPasswordInput = (style: any) => {
    const formStyle = {...MaterialInputOnWhite,
      container: {...MaterialInputOnWhite.container}
    }
    return <View style={[ConfirmPasswordModalStyle.middle.container, {paddingBottom: 4}]} >
      <FormField onChangeText={this.textChange}
        style={formStyle}
        label={s.strings.confirm_password_text}
        value={this.state.confimPassword}
        secureTextEntry
        autoFocus/>
    </View>
  }

  render () {
    let height = 108
    let modalBottom = <View style={[styles.container, {flexDirection: 'column'}]}>
      {this.renderPasswordInput()}
      <OptionButtons
        positiveText={s.strings.string_get_seed}
        onPositive={this.onPositive}
        onNegative={this.onNegative}
      />
    </View>

    let modalMiddle = <OptionSubtext
      confirmationText={s.strings.fragment_wallets_get_seed_wallet_first_confirm_message_mobile}
      label={s.strings.fragment_wallets_get_seed_wallet}
    />

    if (this.props.privateSeedUnlocked) {
      modalBottom = <T> {this.props.getSeed()} </T>
      modalMiddle = null
      height = 50
    }

    return <StylizedModal
      featuredIcon={<OptionIcon iconName={Constants.GET_SEED}/>}
      headerText={s.strings.fragment_wallets_get_seed_wallet}
      modalMiddle={modalMiddle}
      modalBottom={modalBottom}
      modalBottomStyle={{height}}
      style={styles.getSeedModal}
      visibilityBoolean={this.props.visibilityBoolean}
      onExitButtonFxn={this.props.onExitButtonFxn}
    />
  }
}
