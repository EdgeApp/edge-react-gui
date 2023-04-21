import { asMaybe, asObject, asString } from 'cleaners'
import { EdgeCurrencyWallet, EdgeToken } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logActivity } from '../../util/logger'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { ButtonsModal } from '../modals/ButtonsModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { MainButton } from '../themed/MainButton'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'

interface Props {
  navigation: NavigationProp<'editToken'>
  route: RouteProp<'editToken'>
  wallet: EdgeCurrencyWallet
}

function EditTokenSceneComponent(props: Props) {
  const { navigation, route, wallet } = props
  const { tokenId } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)

  // Extract our initial state from the token:
  const [currencyCode, setCurrencyCode] = React.useState(route.params.currencyCode ?? '')
  const [displayName, setDisplayName] = React.useState(route.params.displayName ?? '')
  const [contractAddress, setContractAddress] = React.useState<string>(() => {
    const clean = asMaybeContractLocation(route.params.networkLocation)
    if (clean == null) return ''
    return clean.contractAddress
  })
  const [decimalPlaces, setDecimalPlaces] = React.useState<string>(() => {
    const { multiplier } = route.params
    if (multiplier == null || !/^10*$/.test(multiplier)) return '18'
    return (multiplier.length - 1).toString()
  })

  const handleDelete = useHandler(async () => {
    if (tokenId == null) return
    await Airship.show<'ok' | 'cancel' | undefined>(bridge => (
      <ButtonsModal
        // @ts-expect-error
        bridge={bridge}
        title={lstrings.string_delete}
        message={lstrings.edittoken_delete_prompt}
        buttons={{
          ok: {
            label: lstrings.string_delete,
            async onPress() {
              await wallet.currencyConfig.removeCustomToken(tokenId)
              logActivity(`Delete Custom Token: ${account.username} -- ${getWalletName(wallet)} -- ${wallet.type} -- ${tokenId} -- ${currencyCode}`)

              navigation.goBack()
              return true
            }
          },
          cancel: { label: lstrings.string_cancel_cap }
        }}
      />
    ))
  })

  const handleSave = useHandler(async () => {
    // Validate input:
    const decimals = parseInt(decimalPlaces)
    if (currencyCode === '' || displayName === '' || contractAddress === '') {
      return await showMessage(lstrings.addtoken_invalid_information)
    }
    if (isNaN(decimals)) {
      return await showMessage(lstrings.edittoken_invalid_decimal_places)
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
      logActivity(`Add Custom Token: ${account.username} -- ${getWalletName(wallet)} -- ${wallet.type} -- ${tokenId} -- ${currencyCode} -- ${decimals}`)
    }
    navigation.goBack()
  })

  return (
    <SceneWrapper avoidKeyboard>
      <SceneHeader title={tokenId == null ? lstrings.title_add_token : lstrings.title_edit_token} underline />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <OutlinedTextInput
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={false}
          label={lstrings.addtoken_currency_code_input_text}
          marginRem={marginRem}
          value={currencyCode}
          onChangeText={setCurrencyCode}
        />
        <OutlinedTextInput
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={false}
          label={lstrings.addtoken_name_input_text}
          marginRem={marginRem}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <OutlinedTextInput
          autoCorrect={false}
          autoFocus={false}
          label={lstrings.addtoken_contract_address_input_text}
          marginRem={marginRem}
          value={contractAddress}
          onChangeText={setContractAddress}
        />
        <OutlinedTextInput
          autoCorrect={false}
          autoFocus={false}
          keyboardType="numeric"
          label={lstrings.addtoken_denomination_input_text}
          marginRem={marginRem}
          value={decimalPlaces}
          onChangeText={setDecimalPlaces}
        />
        <MainButton alignSelf="center" label={lstrings.string_save} marginRem={marginRem} onPress={handleSave} />
        {tokenId == null ? null : (
          <MainButton //
            alignSelf="center"
            label={lstrings.edittoken_delete_token}
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
  Airship.show<'ok' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      message={message}
      buttons={{
        ok: { label: lstrings.string_ok_cap }
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
    padding: theme.rem(1),
    paddingTop: theme.rem(1.5)
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

export const EditTokenScene = withWallet(EditTokenSceneComponent)
