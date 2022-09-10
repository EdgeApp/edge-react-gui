import { asMaybe, asObject, asString } from 'cleaners'
import { EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import s from '../../locales/strings'
import { useMemo, useState } from '../../types/reactHooks'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'editToken'>
  route: RouteProp<'editToken'>
}

export function EditTokenScene(props: Props) {
  const { navigation, route } = props
  const { tokenId, walletId } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[walletId]

  // Extract our initial state from the token:
  const [currencyCode, setCurrencyCode] = useState(route.params.currencyCode ?? '')
  const [displayName, setDisplayName] = useState(route.params.displayName ?? '')
  const [contractAddress, setContractAddress] = useState<string>(() => {
    const clean = asMaybeContractLocation(route.params.networkLocation)
    if (clean == null) return ''
    return clean.contractAddress
  })
  const [decimalPlaces, setDecimalPlaces] = useState<string>(() => {
    const { multiplier } = route.params
    if (multiplier == null || !/^10*$/.test(multiplier)) return '18'
    return (multiplier.length - 1).toString()
  })

  const handleDelete = useHandler(async () => {
    if (tokenId == null) return
    await Airship.show(bridge => (
      <ButtonsModal
        bridge={bridge}
        title={s.strings.string_delete}
        message={s.strings.edittoken_delete_prompt}
        buttons={{
          ok: {
            label: s.strings.string_delete,
            async onPress() {
              await wallet.currencyConfig.removeCustomToken(tokenId)
              logActivity(`Delete Custom Token: ${account.username} -- ${wallet.name ?? 'no_wallet_name'} -- ${wallet.type} -- ${tokenId} -- ${currencyCode}`)

              navigation.goBack()
              return true
            }
          },
          cancel: { label: s.strings.string_cancel_cap }
        }}
      />
    ))
  })

  const handleSave = useHandler(async () => {
    // Validate input:
    const decimals = parseInt(decimalPlaces)
    if (currencyCode === '' || displayName === '' || contractAddress === '') {
      return await showMessage(s.strings.addtoken_invalid_information)
    }
    if (isNaN(decimals)) {
      return await showMessage(s.strings.edittoken_invalid_decimal_places)
    }
    // TODO:
    // We need to check for conflicts with the other tokens in the account,
    // both for matching contract addresses and for currency codes.

    const token: EdgeToken = {
      currencyCode,
      displayName,
      denominations: [
        {
          multiplier: '1' + '0'.repeat(decimals),
          name: currencyCode,
          symbol: ''
        }
      ],
      networkLocation: {
        contractAddress
      }
    }

    if (tokenId != null) {
      await wallet.currencyConfig.changeCustomToken(tokenId, token)
    } else {
      const tokenId = await wallet.currencyConfig.addCustomToken(token)
      await wallet.changeEnabledTokenIds([...wallet.enabledTokenIds, tokenId])
      logActivity(
        `Add Custom Token: ${account.username} -- ${wallet.name ?? 'no_wallet_name'} -- ${wallet.type} -- ${tokenId} -- ${currencyCode} -- ${decimals}`
      )
    }
    navigation.goBack()
  })

  const sceneHeader = useMemo(() => <SceneHeader underline title={tokenId == null ? s.strings.title_add_token : s.strings.title_edit_token} />, [tokenId])

  return (
    <SceneWrapper avoidKeyboard>
      {sceneHeader}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <OutlinedTextInput
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={false}
          label={s.strings.addtoken_currency_code_input_text}
          marginRem={marginRem}
          value={currencyCode}
          onChangeText={setCurrencyCode}
        />
        <OutlinedTextInput
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={false}
          label={s.strings.addtoken_name_input_text}
          marginRem={marginRem}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <OutlinedTextInput
          autoCorrect={false}
          autoFocus={false}
          label={s.strings.addtoken_contract_address_input_text}
          marginRem={marginRem}
          value={contractAddress}
          onChangeText={setContractAddress}
        />
        <OutlinedTextInput
          autoCorrect={false}
          autoFocus={false}
          keyboardType="numeric"
          label={s.strings.addtoken_denomination_input_text}
          marginRem={marginRem}
          value={decimalPlaces}
          onChangeText={setDecimalPlaces}
        />
        <MainButton alignSelf="center" label={s.strings.string_save} marginRem={marginRem} onPress={handleSave} />
        {tokenId == null ? null : (
          <MainButton //
            alignSelf="center"
            label={s.strings.edittoken_delete_token}
            marginRem={marginRem}
            type="secondary"
            onPress={handleDelete}
          />
        )}
      </ScrollView>
    </SceneWrapper>
  )
}

/**
 * Interprets a token location as a contract address.
 * In the future this scene may need to handle other weird networks
 * where the networkLocation has other contents.
 */
const asMaybeContractLocation = asMaybe(asObject({ contractAddress: asString }))

async function showMessage(message: string): Promise<void> {
  Airship.show(bridge => (
    <ButtonsModal
      bridge={bridge}
      message={message}
      buttons={{
        ok: { label: s.strings.string_ok_cap }
      }}
    />
  ))
}

// Nicely spaces the visual elements on the page:
const marginRem = [0.5, 0.5, 1]

const getStyles = cacheStyles((theme: Theme) => ({
  scroll: {
    flexGrow: 1,
    marginTop: theme.rem(-0.5)
  },
  scrollContainer: {
    padding: theme.rem(1)
  },
  rightIcon: {
    color: theme.iconTappable,
    marginRight: theme.rem(1)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  tokenList: {
    marginTop: theme.rem(-0.5),
    flex: 4
  }
}))
