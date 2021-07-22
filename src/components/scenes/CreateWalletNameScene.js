// @flow

import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { CREATE_WALLET_REVIEW } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { Actions } from '../../types/routerTypes.js'
import type { CreateWalletType, GuiFiatType } from '../../types/types.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { EdgeTextFieldOutlined } from '../themed/EdgeOutlinedField'
import { SceneHeader } from '../themed/SceneHeader'
import { SecondaryButton } from '../themed/ThemedButtons'

export type CreateWalletNameOwnProps = {
  selectedFiat: GuiFiatType,
  selectedWalletType: CreateWalletType,
  cleanedPrivateKey?: string
}
type Props = CreateWalletNameOwnProps
type State = {
  walletName: string,
  isFocused: boolean
}

export class CreateWalletName extends React.Component<Props, State> {
  textInput = React.createRef()

  constructor(props: Props) {
    super(props)
    let walletName = ''
    // XXX Hack for Ripple
    if (this.props.selectedWalletType.currencyCode.toLowerCase() === 'xrp') {
      walletName = sprintf(s.strings.my_crypto_wallet_name, 'XRP')
    } else {
      walletName = sprintf(s.strings.my_crypto_wallet_name, this.props.selectedWalletType.currencyName)
    }
    this.state = { walletName, isFocused: true }
  }

  isValidWalletName = () => {
    const { walletName } = this.state
    const isValid = walletName.length > 0

    return isValid
  }

  clearText = () => {
    this.setState({ walletName: '' })
    if (this.textInput.current) {
      this.textInput.current.blur()
    }
  }

  handleOnFocus = () => {
    this.setState({ isFocused: true })
  }

  handleOnBlur = () => {
    this.setState({ isFocused: false })
  }

  onNext = () => {
    const { cleanedPrivateKey, selectedFiat, selectedWalletType } = this.props
    if (this.isValidWalletName()) {
      Actions.push(CREATE_WALLET_REVIEW, {
        walletName: this.state.walletName,
        selectedFiat: selectedFiat,
        selectedWalletType: selectedWalletType,
        cleanedPrivateKey
      })
    } else {
      Alert.alert(s.strings.create_wallet_invalid_name, s.strings.create_wallet_enter_valid_name)
    }
  }

  handleChangeWalletName = (walletName: string) => {
    this.setState({ walletName })
  }

  render() {
    return (
      <SceneWrapper avoidKeyboard background="theme">
        <SceneHeader withTopMargin title={s.strings.title_create_wallet} />

        <EdgeTextFieldOutlined
          onChangeText={this.handleChangeWalletName}
          value={this.state.walletName}
          onSubmitEditing={this.onNext}
          autoFocus
          autoCorrect={false}
          returnKeyType="next"
          onFocus={this.handleOnFocus}
          onBlur={this.handleOnBlur}
          label={s.strings.fragment_wallets_addwallet_name_hint}
          onClear={this.clearText}
          isClearable={this.state.isFocused}
          marginRem={[0, 1.75]}
          ref={this.textInput}
          blurOnSubmit
          showSearchIcon={false}
        />
        <SecondaryButton onPress={this.onNext} label={s.strings.string_next_capitalized} marginRem={[3, 6]} />
      </SceneWrapper>
    )
  }
}
