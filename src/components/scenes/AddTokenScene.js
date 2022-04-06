// @flow

import * as React from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native'

import { addNewToken } from '../../actions/AddTokenActions.js'
import { MAX_TOKEN_CODE_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import { scale } from '../../util/scaling.js'
import { decimalPlacesToDenomination } from '../../util/utils.js'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'

type Props = {
  route: RouteProp<'addToken'>
}

export function AddTokenScene(props: Props) {
  const { route } = props
  const { walletId } = route.params
  const dispatch = useDispatch()

  let [currencyCode, setCurrencyCode] = useState(route.params.currencyCode ?? '')
  const [currencyName, setCurrencyName] = useState(route.params.currencyName ?? '')
  const [contractAddress, setContractAddress] = useState(route.params.contractAddress ?? '')
  const [decimalPlaces, setDecimalPlaces] = useState(route.params.decimalPlaces ?? '')

  const addTokenPending = useSelector(state => state.ui.wallets.addTokenPending)
  const currentCustomTokens = useSelector(state => state.ui.settings.customTokens)
  const wallet = useSelector(state => state.ui.wallets.byId[walletId])

  const handleSave = () => {
    currencyCode = currencyCode.toUpperCase()
    setCurrencyCode(currencyCode)

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
        dispatch(addNewToken(walletId, currencyName, currencyCode, contractAddress, denomination, wallet.type))
      } else {
        Alert.alert(s.strings.addtoken_invalid_information)
      }
    }
  }

  return (
    <SceneWrapper background="body">
      <ScrollView style={styles.container}>
        <View style={styles.instructionalArea}>
          <Text style={styles.instructionalText}>{s.strings.addtoken_top_instructions}</Text>
        </View>
        <View style={styles.nameArea}>
          <FormField
            value={currencyName}
            onChangeText={setCurrencyName}
            autoCapitalize="words"
            autoFocus
            label={s.strings.addtoken_name_input_text}
            returnKeyType="done"
            autoCorrect={false}
          />
        </View>
        <View style={styles.currencyCodeArea}>
          <FormField
            value={currencyCode}
            onChangeText={setCurrencyCode}
            autoCapitalize="characters"
            label={s.strings.addtoken_currency_code_input_text}
            returnKeyType="done"
            autoCorrect={false}
            maxLength={MAX_TOKEN_CODE_CHARACTERS}
          />
        </View>
        <View style={styles.contractAddressArea}>
          <FormField
            value={contractAddress}
            onChangeText={setContractAddress}
            label={s.strings.addtoken_contract_address_input_text}
            returnKeyType="done"
            autoCorrect={false}
          />
        </View>
        <View style={styles.decimalPlacesArea}>
          <FormField
            value={decimalPlaces}
            onChangeText={setDecimalPlaces}
            label={s.strings.addtoken_denomination_input_text}
            returnKeyType="done"
            autoCorrect={false}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.buttonsArea}>
          <PrimaryButton style={styles.saveButton} onPress={handleSave}>
            {addTokenPending ? <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} /> : <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>}
          </PrimaryButton>
        </View>
        <View style={styles.bottomPaddingForKeyboard} />
      </ScrollView>
    </SceneWrapper>
  )
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
