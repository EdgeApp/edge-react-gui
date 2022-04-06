// @flow

import * as React from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native'

import { deleteCustomToken, editCustomToken } from '../../actions/WalletActions.js'
import { MAX_TOKEN_CODE_CHARACTERS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { PrimaryButton } from '../../modules/UI/components/Buttons/PrimaryButton.ui.js'
import { TertiaryButton } from '../../modules/UI/components/Buttons/TertiaryButton.ui.js'
import { FormattedText as Text } from '../../modules/UI/components/FormattedText/FormattedText.ui.js'
import { THEME } from '../../theme/variables/airbitz.js'
import { useEffect, useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type RouteProp } from '../../types/routerTypes.js'
import { scale } from '../../util/scaling.js'
import { decimalPlacesToDenomination, denominationToDecimalPlaces, mergeTokensRemoveInvisible } from '../../util/utils'
import { FormField } from '../common/FormField.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { ButtonsModal } from '../modals/ButtonsModal.js'
import { Airship } from '../services/AirshipInstance.js'

type Props = {
  route: RouteProp<'editToken'>
}

export function EditTokenScene(props: Props) {
  const { route } = props
  const { walletId, metaTokens } = route.params
  const dispatch = useDispatch()

  // Look up the custom token given by the route props:
  const customTokens = useSelector(state => state.ui.settings.customTokens)
  const customToken = customTokens.find(item => item.currencyCode === route.params.currencyCode)
  useEffect(() => {
    if (customToken == null) Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_improper_token_load)
  }, [customToken])

  let [currencyCode, setCurrencyCode] = useState(route.params.currencyCode)
  const [currencyName, setCurrencyName] = useState(customToken?.currencyName ?? '')
  const [contractAddress, setContractAddress] = useState(customToken?.contractAddress ?? '')
  const [decimalPlaces, setDecimalPlaces] = useState(customToken != null ? denominationToDecimalPlaces(customToken.denomination) : '')

  const editCustomTokenProcessing = useSelector(state => state.ui.scenes.editToken.editCustomTokenProcessing)

  const handleDelete = () => {
    Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.string_delete}
        message={s.strings.edittoken_delete_prompt}
        buttons={{
          ok: {
            label: s.strings.string_delete,
            async onPress() {
              await dispatch(deleteCustomToken(walletId, route.params.currencyCode))
              return true
            }
          },
          cancel: { label: s.strings.string_cancel_cap }
        }}
      />
    ))
  }

  const handleSave = () => {
    currencyCode = currencyCode.toUpperCase()

    if (currencyName && currencyCode && decimalPlaces && contractAddress) {
      const visibleTokens = mergeTokensRemoveInvisible(metaTokens, customTokens)
      const indexInVisibleTokens = visibleTokens.findIndex(token => token.currencyCode === currencyCode)
      if (currencyCode !== route.params.currencyCode) {
        // if the currencyCode will change
        if (indexInVisibleTokens >= 0) {
          // if the new currency code is already taken / visible
          Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_duplicate_currency_code)
        } else {
          // not in the array of visible tokens, CASE 3
          if (parseInt(decimalPlaces) !== 'NaN') {
            const denomination = decimalPlacesToDenomination(decimalPlaces)
            dispatch(editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, route.params.currencyCode))
          } else {
            Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_invalid_decimal_places)
          }
        }
      } else {
        if (parseInt(decimalPlaces) !== 'NaN') {
          const denomination = decimalPlacesToDenomination(decimalPlaces)
          dispatch(editCustomToken(walletId, currencyName, currencyCode, contractAddress, denomination, route.params.currencyCode))
        } else {
          Alert.alert(s.strings.edittoken_delete_title, s.strings.edittoken_invalid_decimal_places)
        }
      }
    } else {
      Alert.alert(s.strings.edittoken_delete_title, s.strings.addtoken_default_error_message)
    }
  }

  return (
    <SceneWrapper avoidKeyboard background="body">
      {gap => (
        <ScrollView style={[styles.container, { marginBottom: -gap.bottom }]} contentContainerStyle={{ paddingBottom: gap.bottom }}>
          <View style={styles.instructionalArea}>
            <Text style={styles.instructionalText}>{s.strings.edittoken_top_instructions}</Text>
          </View>
          <View style={styles.nameArea}>
            <FormField
              value={currencyName}
              onChangeText={setCurrencyName}
              autoCapitalize="words"
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
              autoCorrect={false}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.errorMessageArea} />
          <View style={styles.buttonsArea}>
            <TertiaryButton onPress={handleDelete} style={styles.deleteButton}>
              <TertiaryButton.Text>{s.strings.edittoken_delete_token}</TertiaryButton.Text>
            </TertiaryButton>
            <PrimaryButton style={styles.saveButton} onPress={handleSave}>
              {editCustomTokenProcessing ? (
                <ActivityIndicator color={THEME.COLORS.ACCENT_MINT} />
              ) : (
                <PrimaryButton.Text>{s.strings.string_save}</PrimaryButton.Text>
              )}
            </PrimaryButton>
          </View>
        </ScrollView>
      )}
    </SceneWrapper>
  )
}

const rawStyles = {
  container: {
    paddingHorizontal: scale(20),
    backgroundColor: THEME.COLORS.GRAY_4
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
  errorMessageArea: {
    height: scale(16),
    justifyContent: 'center',
    alignItems: 'center'
  },
  buttonsArea: {
    marginVertical: scale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: scale(4)
  },
  deleteButton: {
    flex: 1,
    marginRight: scale(1)
  },
  saveButton: {
    flex: 1,
    padding: scale(13),
    marginLeft: scale(1)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)
