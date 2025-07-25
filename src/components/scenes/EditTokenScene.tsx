import {
  EdgeCurrencyWallet,
  EdgeToken,
  EdgeTokenId,
  JsonObject
} from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'
import { sprintf } from 'sprintf-js'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
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

  /** If exists, means they are editing an existing custom token.
   * If missing, then creating/adding a new token */
  tokenId?: EdgeTokenId
  walletId: string
}

interface Props extends EdgeAppSceneProps<'editToken'> {
  wallet: EdgeCurrencyWallet
}

function EditTokenSceneComponent(props: Props) {
  const { navigation, route, wallet } = props
  const { tokenId } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)

  // Extract our initial state from the token:
  const [currencyCode, setCurrencyCode] = React.useState(
    route.params.currencyCode ?? ''
  )
  const [displayName, setDisplayName] = React.useState(
    route.params.displayName ?? ''
  )
  const [decimalPlaces, setDecimalPlaces] = React.useState<string>(() => {
    const { multiplier } = route.params
    if (multiplier == null || !/^10*$/.test(multiplier)) return '18'
    return (multiplier.length - 1).toString()
  })

  const emptyNetworkLocation = () => {
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
  }

  // Extract our initial contract address:
  const { customTokenTemplate = [] } = wallet.currencyInfo
  const [location, setLocation] = React.useState<Map<string, string>>(() => {
    return emptyNetworkLocation()
  })

  // Keep track of whether we auto-completed a token:
  const [didAutoCompleteToken, setDidAutoCompleteToken] =
    React.useState<boolean>(false)
  const isAutoCompleteTokenLoading = React.useRef<boolean>(false)

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
              logActivity(
                `Delete Custom Token: ${account.username} -- ${getWalletName(
                  wallet
                )} -- ${wallet.type} -- ${tokenId} -- ${currencyCode}`
              )

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
          return await showMessage(
            sprintf(
              lstrings.addtoken_invalid_1s,
              translateDescription(item.displayName)
            )
          )
        }
        networkLocation[item.key] = number
      } else if (item.type === 'string') {
        if (value === '') {
          return await showMessage(
            sprintf(
              lstrings.addtoken_invalid_1s,
              translateDescription(item.displayName)
            )
          )
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
      // Creating a new token
      const { currencyConfig } = wallet
      const { builtinTokens } = currencyConfig

      const newTokenId = await currencyConfig.getTokenId(customTokenInput)

      // Check if custom token input conflicts with built-in tokens.
      const matchingBuiltinTokenId = Object.keys(builtinTokens).find(
        builtinTokenId => builtinTokenId === newTokenId
      )
      if (matchingBuiltinTokenId != null) {
        await showMessage(
          sprintf(
            lstrings.warning_token_exists_1s,
            builtinTokens[matchingBuiltinTokenId].currencyCode
          )
        )
        return
      }

      const isMatchingBuiltinCurrencyCode =
        Object.values(builtinTokens).find(
          builtInToken => builtInToken.currencyCode === currencyCode
        ) != null
      const approveAdd = !isMatchingBuiltinCurrencyCode
        ? true
        : await Airship.show<boolean>(bridge => (
            <ConfirmContinueModal
              bridge={bridge}
              body={sprintf(
                lstrings.warning_token_code_override_2s,
                currencyCode,
                config.supportEmail
              )}
              title={lstrings.string_warning}
              warning
              isSkippable
            />
          ))

      if (approveAdd) {
        // Check if custom token input conflicts with custom tokens.
        if (currencyConfig.customTokens[newTokenId] != null) {
          // Always override changes to custom tokens
          // TODO: Fine for if they are on this scene intentionally modifying a
          // custom token, but maybe warn about this override if they are trying
          // to add a new custom token with the same contract address as an
          // existing custom token
          await currencyConfig.changeCustomToken(newTokenId, customTokenInput)
        } else {
          await currencyConfig.addCustomToken(customTokenInput)
        }

        await wallet.changeEnabledTokenIds([
          ...wallet.enabledTokenIds,
          newTokenId
        ])
        logActivity(
          `Add Custom Token: ${account.username} -- ${getWalletName(
            wallet
          )} -- ${
            wallet.type
          } -- ${newTokenId} -- ${currencyCode} -- ${decimals}`
        )
      }
      navigation.goBack()
    }
  })

  const autoCompleteToken = async (searchString: string) => {
    if (
      // Ignore autocomplete if it's already loading
      isAutoCompleteTokenLoading.current ||
      // and ignore autocomplete if the scene was initialized with any of the token details prefilled,
      route.params.currencyCode != null ||
      route.params.displayName != null ||
      route.params.multiplier != null ||
      route.params.networkLocation != null
    ) {
      return
    }

    isAutoCompleteTokenLoading.current = true
    const [token] = await wallet.currencyConfig
      .getTokenDetails({ contractAddress: searchString })
      .catch(() => [])
    isAutoCompleteTokenLoading.current = false

    if (token != null) {
      setCurrencyCode(token.currencyCode)
      setDisplayName(token.displayName)
      setDecimalPlaces(
        (token.denominations[0].multiplier.length - 1).toString()
      )
      setLocation(location => {
        const out = new Map(location)
        for (const [key, value] of Object.entries(
          token.networkLocation ?? {}
        )) {
          out.set(key, value.replace(/\s/g, ''))
        }
        return out
      })
      setDidAutoCompleteToken(true)
    } else if (token == null && didAutoCompleteToken) {
      setCurrencyCode('')
      setDisplayName('')
      setDecimalPlaces('18')
      setLocation(location => {
        return emptyNetworkLocation()
      })
      setDidAutoCompleteToken(false)
    }
  }

  const renderCustomTokenTemplateRows = () => {
    return customTokenTemplate
      .sort((a, b) => (a.key === 'contractAddress' ? -1 : 1))
      .map(item => {
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
            onChangeText={value => {
              setLocation(location => {
                const out = new Map(location)
                out.set(item.key, value.replace(/\s/g, ''))
                return out
              })

              if (item.key === 'contractAddress') {
                autoCompleteToken(value).catch(() => {})
              }
            }}
          />
        )
      })
  }

  return (
    <SceneWrapper avoidKeyboard>
      <SceneHeader
        title={
          tokenId == null ? lstrings.title_add_token : lstrings.title_edit_token
        }
        underline
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
        scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
      >
        {renderCustomTokenTemplateRows()}
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
          secondary={
            tokenId == null
              ? undefined
              : {
                  label: lstrings.edittoken_delete_token,
                  onPress: handleDelete
                }
          }
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
