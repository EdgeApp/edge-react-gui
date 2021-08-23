// @flow

import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { CREATE_WALLET_REVIEW } from '../../constants/SceneKeys.js'
import s from '../../locales/strings.js'
import { type RouteProp, Actions } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { MainButton } from '../themed/MainButton.js'
import { type OutlinedTextInputRef, OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader'

export type CreateWalletNameOwnProps = {
  route: RouteProp<'createWalletName'>
}
type Props = CreateWalletNameOwnProps
type State = {
  walletName: string
}

export class CreateWalletName extends React.Component<Props, State> {
  textInput: { current: OutlinedTextInputRef | null } = React.createRef()

  constructor(props: Props) {
    super(props)
    const { route } = props
    const { currencyCode, currencyName } = route.params.selectedWalletType

    const name = currencyCode.toLowerCase() === 'xrp' ? 'XRP' : currencyName
    const walletName = sprintf(s.strings.my_crypto_wallet_name, name)
    this.state = { walletName }
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

  onNext = () => {
    const { route } = this.props
    const { cleanedPrivateKey, selectedFiat, selectedWalletType } = route.params
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

        <OutlinedTextInput
          onChangeText={this.handleChangeWalletName}
          value={this.state.walletName}
          onSubmitEditing={this.onNext}
          autoFocus
          autoCorrect={false}
          returnKeyType="next"
          label={s.strings.fragment_wallets_addwallet_name_hint}
          onClear={this.clearText}
          clearIcon
          marginRem={[0, 1.75]}
          ref={this.textInput}
          blurOnSubmit
        />
        <MainButton alignSelf="center" label={s.strings.string_next_capitalized} marginRem={[3, 1]} type="secondary" onPress={this.onNext} />
      </SceneWrapper>
    )
  }
}
