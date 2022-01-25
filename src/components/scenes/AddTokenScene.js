// @flow

import * as React from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native'

import { addNewToken } from '../../actions/AddTokenActions.js'
import { MAX_TOKEN_CODE_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { connect } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import type { CustomTokenInfo, GuiWallet } from '../../types/types.js'
import { scale } from '../../util/scaling.js'
import { decimalPlacesToDenomination } from '../../util/utils.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type OwnProps = {
  route: RouteProp<'addToken'>
}

type DispatchProps = {
  addNewToken: (walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, type: string) => void
}

type StateProps = {
  addTokenPending: boolean,
  currentCustomTokens: CustomTokenInfo[],
  wallet: GuiWallet
}

type State = {
  currencyName: string,
  currencyCode: string,
  contractAddress: string,
  decimalPlaces: string,
  enabled?: boolean
}

type Props = OwnProps & StateProps & DispatchProps

class AddToken extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    const { route } = this.props
    const { currencyName = '', currencyCode = '', contractAddress = '', decimalPlaces = '' } = route.params
    this.state = {
      currencyName,
      currencyCode,
      contractAddress,
      decimalPlaces
    }
  }

  render() {
    const { addTokenPending } = this.props
    return (
      <SceneWrapper background="body">
        <ScrollView style={styles.container}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.addtoken_top_instructions}</Text>
          </View>
          <View style={styles.nameArea}>
            <FormField
              value={this.state.currencyName}
              onChangeText={this.onChangeName}
              autoCapitalize="words"
              autoFocus
              label={s.strings.addtoken_name_input_text}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
          <View style={styles.currencyCodeArea}>
            <FormField
              value={this.state.currencyCode}
              onChangeText={this.onChangeCurrencyCode}
              autoCapitalize="characters"
              label={s.strings.addtoken_currency_code_input_text}
              returnKeyType="done"
              autoCorrect={false}
              maxLength={MAX_TOKEN_CODE_CHARACTERS}
            />
          </View>
          <View style={styles.contractAddressArea}>
            <FormField
              value={this.state.contractAddress}
              onChangeText={this.onChangeContractAddress}
              label={s.strings.addtoken_contract_address_input_text}
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
          <View style={styles.decimalPlacesArea}>
            <FormField
              value={this.state.decimalPlaces}
              onChangeText={this.onChangeDecimalPlaces}
              label={s.strings.addtoken_denomination_input_text}
              returnKeyType="done"
              autoCorrect={false}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.buttonsArea}>
            <PrimaryButton style={styles.saveButton} onPress={this._onSave}>
              {addTokenPending ? <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} /> : <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>}
            </PrimaryButton>
          </View>
          <View style={styles.bottomPaddingForKeyboard} />
        </ScrollView>
      </SceneWrapper>
    )
  }

  onChangeName = (input: string) => {
    this.setState({
      currencyName: input
    })
  }

  onChangeCurrencyCode = (input: string) => {
    this.setState({
      currencyCode: input
    })
  }

  onChangeDecimalPlaces = (input: string) => {
    this.setState({
      decimalPlaces: input
    })
  }

  onChangeContractAddress = (input: string) => {
    this.setState({
      contractAddress: input.trim()
    })
  }

  _onSave = () => {
    const currencyCode = this.state.currencyCode.toUpperCase()
    this.setState(
      {
        currencyCode
      },
      () => {
        const { route, currentCustomTokens, wallet, addNewToken } = this.props
        const { currencyName, decimalPlaces, contractAddress } = this.state
        const { walletId } = route.params

        const currentCustomTokenIndex = currentCustomTokens.findIndex(item => item.currencyCode === currencyCode)
        const metaTokensIndex = wallet.metaTokens.findIndex(item => item.currencyCode === currencyCode)
        // if token is hard-coded into wallets of this type
        if (metaTokensIndex >= 0) Alert.alert(s.strings.manage_tokens_duplicate_currency_code)
        // if that token already exists and is visible (ie not deleted)
        if (currentCustomTokenIndex >= 0 && currentCustomTokens[currentCustomTokenIndex].isVisible !== false) {
          Alert.alert(s.strings.manage_tokens_duplicate_currency_code)
        } else {
          if (currencyName && currencyCode && decimalPlaces && contractAddress) {
            const denomination = decimalPlacesToDenomination(decimalPlaces)
            addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, wallet.type)
          } else {
            Alert.alert(s.strings.addtoken_invalid_information)
          }
        }
      }
    )
  }
}

const rawStyles = {
  container: {
    flex: 1,
    paddingHorizontal: scale(20)
  },

  instructionalArea: {
    paddingVertical: scale(16),
    paddingHorizontal: scale(20)
  },
  instructionalText: {
    fontSize: scale(16),
    textAlign: 'center'
  },

  nameArea: {
    height: scale(70)
  },
  currencyCodeArea: {
    height: scale(70)
  },
  contractAddressArea: {
    height: scale(70)
  },
  decimalPlacesArea: {
    height: scale(70)
  },
  buttonsArea: {
    marginTop: scale(16),
    height: scale(52),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: scale(4)
  },
  saveButton: {
    flex: 1,
    marginLeft: scale(2),
    backgroundColor: THEME.COLORS.SECONDARY,
    borderRadius: 3
  },
  bottomPaddingForKeyboard: {
    height: scale(300)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

export const AddTokenScene = connect<StateProps, DispatchProps, OwnProps>(
  (state, { route: { params } }) => ({
    addTokenPending: state.ui.wallets.addTokenPending,
    currentCustomTokens: state.ui.settings.customTokens,
    wallet: state.ui.wallets.byId[params.walletId]
  }),
  dispatch => ({
    addNewToken(walletId: string, currencyName: string, currencyCode: string, contractAddress: string, denomination: string, walletType: string) {
      dispatch(addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, walletType))
    }
  })
)(AddToken)
