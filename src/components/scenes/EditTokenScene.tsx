import { EdgeCurrencyWallet, EdgeToken, EdgeTokenId, JsonObject } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { logActivity } from '../../util/logger'
import { ButtonsView } from '../buttons/ButtonsView'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { ButtonsModal } from '../modals/ButtonsModal'
import { ConfirmContinueModal } from '../modals/ConfirmContinueModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { FilledTextInput } from '../themed/FilledTextInput'
import { SceneHeader } from '../themed/SceneHeader'

export interface EditTokenParams {
  currencyCode?: string
  displayName?: string
  multiplier?: string
  networkLocation?: JsonObject
  tokenId?: EdgeTokenId // Acts like "add token" if this is missing
  walletId: string
}

interface Props extends EdgeSceneProps<'editToken'> {
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
  const [decimalPlaces, setDecimalPlaces] = React.useState<string>(() => {
    const { multiplier } = route.params
    if (multiplier == null || !/^10*$/.test(multiplier)) return '18'
    return (multiplier.length - 1).toString()
  })

  // Extract our initial contract address:
  const { customTokenTemplate = [] } = wallet.currencyInfo
  const [location, setLocation] = React.useState<Map<string, string>>(() => {
    const out = new Map<string, string>()
    for (const item of customTokenTemplate) {
      const value = route.params.networkLocation?.[item.key]
      if (item.type === 'number') {
        out.set(item.key, typeof value === 'number' ? value.toFixed() : '')
      } else if (item.type === 'string') {
        out.set(item.key, typeof value === 'string' ? value : '')
      }
      // Note: Token templates don't support `item.type === 'nativeAmount'`
    }
    return out
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
    if (currencyCode === '' || displayName === '') {
      return await showMessage(lstrings.addtoken_invalid_information)
    }
    const decimals = parseInt(decimalPlaces)
    if (isNaN(decimals)) {
      return await showMessage(lstrings.edittoken_invalid_decimal_places)
    }

    // Assemble the network location:
    const networkLocation: JsonObject = {}
    for (const item of customTokenTemplate) {
      const value = location.get(item.key) ?? ''
      if (item.type === 'number') {
        const number = parseInt(value)
        if (isNaN(number)) {
          return await showMessage(sprintf(lstrings.addtoken_invalid_1s, translateDescription(item.displayName)))
        }
        networkLocation[item.key] = number
      } else if (item.type === 'string') {
        if (value === '') {
          return await showMessage(sprintf(lstrings.addtoken_invalid_1s, translateDescription(item.displayName)))
        }
        networkLocation[item.key] = value
      }
      // Note: Token templates don't support `item.type === 'nativeAmount'`
    }

    const customTokenInput: EdgeToken = {
      currencyCode,
      displayName,
      denominations: [
        {
          multiplier: '1' + '0'.repeat(decimals),
          name: currencyCode,
          symbol: ''
        }
      ],
      networkLocation
    }

    if (tokenId != null) {
      await wallet.currencyConfig.changeCustomToken(tokenId, customTokenInput)
      navigation.goBack()
    } else {
      const { currencyConfig } = wallet
      const { builtinTokens } = currencyConfig

      // Check if custom token input conflicts with built-in tokens.
      // There's currently no mechanism to obtain a new custom token's tokenId
      // for proper comparison against built-in tokens besides physically adding
      // the new custom token first.
      const newTokenId = await currencyConfig.addCustomToken(customTokenInput)

      const matchingContractToken =
        Object.keys(builtinTokens).find(builtinTokenId => builtinTokenId === newTokenId) == null ? undefined : builtinTokens[newTokenId]
      const isMatchingCurrencyCode = Object.values(builtinTokens).find(builtInToken => builtInToken.currencyCode === currencyCode) != null

      if (matchingContractToken != null && isMatchingCurrencyCode) {
        await showMessage(sprintf(lstrings.warning_token_exists_1s, currencyCode))
        return
      }

      const warningMessage =
        isMatchingCurrencyCode && matchingContractToken == null
          ? sprintf(lstrings.warning_token_code_override_2s, currencyCode, config.supportEmail)
          : matchingContractToken != null && !isMatchingCurrencyCode
          ? sprintf(lstrings.warning_token_contract_override_3s, currencyCode, matchingContractToken.currencyCode, config.supportEmail)
          : undefined

      const approveAdd =
        warningMessage == null
          ? true
          : await Airship.show<boolean>(bridge => (
              <ConfirmContinueModal bridge={bridge} body={warningMessage} title={lstrings.string_warning} warning isSkippable />
            ))

      if (approveAdd) {
        await wallet.changeEnabledTokenIds([...wallet.enabledTokenIds, newTokenId])
        logActivity(`Add Custom Token: ${account.username} -- ${getWalletName(wallet)} -- ${wallet.type} -- ${newTokenId} -- ${currencyCode} -- ${decimals}`)
        navigation.goBack()
      } else {
        await currencyConfig.removeCustomToken(newTokenId)
      }
    }
  })

  return (
    <SceneWrapper avoidKeyboard>
      <SceneHeader title={tokenId == null ? lstrings.title_add_token : lstrings.title_edit_token} underline />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer} scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}>
        <FilledTextInput
          aroundRem={0.5}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus={false}
          placeholder={lstrings.addtoken_currency_code_input_text}
          value={currencyCode}
          onChangeText={setCurrencyCode}
        />
        <FilledTextInput
          aroundRem={0.5}
          autoCapitalize="words"
          autoCorrect={false}
          autoFocus={false}
          placeholder={lstrings.addtoken_name_input_text}
          value={displayName}
          onChangeText={setDisplayName}
        />
        {customTokenTemplate.map(item => {
          if (item.type === 'nativeAmount') return null
          return (
            <FilledTextInput
              key={item.key}
              aroundRem={0.5}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={false}
              placeholder={translateDescription(item.displayName)}
              keyboardType={item.type === 'number' ? 'numeric' : 'default'}
              value={location.get(item.key) ?? ''}
              onChangeText={value =>
                setLocation(location => {
                  const out = new Map(location)
                  out.set(item.key, value)
                  return out
                })
              }
            />
          )
        })}
        <FilledTextInput
          aroundRem={0.5}
          autoCorrect={false}
          autoFocus={false}
          keyboardType="numeric"
          placeholder={lstrings.addtoken_denomination_input_text}
          value={decimalPlaces}
          onChangeText={setDecimalPlaces}
        />
        <ButtonsView
          primary={{ label: lstrings.string_save, onPress: handleSave }}
          secondary={tokenId == null ? undefined : { label: lstrings.edittoken_delete_token, onPress: handleDelete }}
          layout="column"
          parentType="scene"
        />
      </ScrollView>
    </SceneWrapper>
  )
}

function translateDescription(displayName: string): string {
  switch (displayName) {
    case 'Contract Address':
      return lstrings.addtoken_contract_address_input_text
    default:
      return displayName
  }
}

async function showMessage(message: string): Promise<void> {
  await Airship.show<'ok' | undefined>(bridge => (
    <ButtonsModal
      bridge={bridge}
      message={message}
      buttons={{
        ok: { label: lstrings.string_ok_cap }
      }}
    />
  ))
}

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
