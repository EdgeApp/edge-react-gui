// @flow

import * as React from 'react'
import { Alert } from 'react-native'
import { sprintf } from 'sprintf-js'

import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { type TestProps } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { SceneWrapper } from '../common/SceneWrapper'
import { type ThemeProps, withTheme } from '../services/ThemeContext.js'
import { MainButton } from '../themed/MainButton.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader'

export type CreateWalletNameOwnProps = {
  navigation: NavigationProp<'createWalletName'>,
  route: RouteProp<'createWalletName'>
}
type Props = CreateWalletNameOwnProps & ThemeProps & TestProps
type State = {
  walletName: string
}

class CreateWalletNameComponent extends React.Component<Props & TestProps, State> {
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

  onNext = () => {
    const { navigation, route } = this.props
    const { cleanedPrivateKey, selectedFiat, selectedWalletType } = route.params
    const { walletType } = selectedWalletType
    const specialCurrencyInfo = getSpecialCurrencyInfo(walletType)

    if (this.isValidWalletName() && specialCurrencyInfo.skipAccountNameValidation && !cleanedPrivateKey) {
      navigation.navigate('createWalletAccountSelect', {
        selectedFiat: selectedFiat,
        selectedWalletType,
        accountName: this.state.walletName,
        existingWalletId: ''
      })
    } else if (this.isValidWalletName()) {
      navigation.navigate('createWalletReview', {
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
    const buttonType = this.props.theme.preferPrimaryButton ? 'primary' : 'secondary'

    return (
      <SceneWrapper avoidKeyboard background="theme">
        <SceneHeader withTopMargin title={s.strings.title_create_wallet} />

        <OutlinedTextInput
          onChangeText={this.handleChangeWalletName}
          value={this.state.walletName}
          onSubmitEditing={this.onNext}
          autoCorrect={false}
          returnKeyType="next"
          label={s.strings.fragment_wallets_addwallet_name_hint}
          marginRem={[0, 1.75]}
        />
        <MainButton
          alignSelf="center"
          label={s.strings.string_next_capitalized}
          marginRem={[3, 1]}
          type={buttonType}
          onPress={this.onNext}
          ref={this.props.generateTestHook('CreateWalletNameScene.NextButton')}
        />
      </SceneWrapper>
    )
  }
}

export const CreateWalletName = withTheme(CreateWalletNameComponent)
