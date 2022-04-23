// @flow

import * as React from 'react'
import { FlatList } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { PREFERRED_TOKENS, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import { useTokens } from '../../hooks/useTokens.js'
import { useWalletName } from '../../hooks/useWalletName.js'
import s from '../../locales/strings.js'
import { useCallback, useEffect, useMemo, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type FlatListItem } from '../../types/types.js'
import { normalizeForSearch } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { CurrencyIcon } from '../themed/CurrencyIcon.js'
import { DividerLine } from '../themed/DividerLine.js'
import { EdgeText } from '../themed/EdgeText.js'
import { MainButton } from '../themed/MainButton.js'
import { ManageTokensRow } from '../themed/ManageTokensRow.js'
import { OutlinedTextInput } from '../themed/OutlinedTextInput.js'
import { SceneHeader } from '../themed/SceneHeader.js'
import { Title } from '../themed/Title.js'

type Props = {
  navigation: NavigationProp<'manageTokens'>,
  route: RouteProp<'manageTokens'>
}

export function ManageTokensScene(props: Props) {
  const { navigation, route } = props
  const { walletId } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)
  const wallet = account.currencyWallets[walletId]
  const walletName = useWalletName(wallet)
  const isCustomTokensSupported = SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId]?.isCustomTokensSupported ?? false

  const [searchValue, setSearchValue] = useState('')

  // Subscribe to the account's token lists:
  const { allTokens, customTokens } = useTokens(wallet.currencyConfig)

  // Subscribe to the wallet's enabled tokens:
  const [enabledTokenIds, setEnabledTokenIds] = useState<string[]>(wallet.enabledTokenIds)
  useEffect(() => {
    setEnabledTokenIds(wallet.enabledTokenIds)
    return wallet.watch('enabledTokenIds', setEnabledTokenIds)
  }, [wallet])

  // Optimize the enabled tokens:
  const enabledTokenSet = useMemo(() => new Set(enabledTokenIds), [enabledTokenIds])

  // Sort the token list:
  const sortedTokenIds = useMemo(() => {
    // Make a table of preferred tokenId's:
    const preferredIds = new Set<string>()
    for (const currencyCode of PREFERRED_TOKENS) {
      const tokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === currencyCode)
      if (tokenId != null) preferredIds.add(tokenId)
    }

    return Object.keys(allTokens).sort((id1, id2) => {
      const token1 = allTokens[id1]
      const token2 = allTokens[id2]
      if (preferredIds.has(id1) && !preferredIds.has(id2)) return -1
      if (!preferredIds.has(id1) && preferredIds.has(id2)) return 1
      if (token1.currencyCode < token2.currencyCode) return -1
      if (token1.currencyCode > token2.currencyCode) return 1
      return 0
    })
  }, [allTokens])

  // Filter the list of tokens based on the search term:
  const filteredTokenIds = useMemo(() => {
    const target = normalizeForSearch(searchValue)
    return sortedTokenIds.filter(tokenId => {
      const token = allTokens[tokenId]
      const currencyCode = normalizeForSearch(token.currencyCode)
      const displayName = normalizeForSearch(token.displayName)
      return currencyCode.includes(target) || displayName.includes(target)
    })
  }, [allTokens, searchValue, sortedTokenIds])

  // Shows the wallet picker modal:
  const handleSelectWallet = useCallback(async () => {
    const allowedCurrencyCodes = Object.keys(account.currencyConfig)
      .filter(pluginId => Object.keys(account.currencyConfig[pluginId].builtinTokens ?? {}).length > 0)
      .map(pluginId => account.currencyConfig[pluginId].currencyInfo.currencyCode)

    const { walletId, currencyCode } = await Airship.show(bridge => (
      <WalletListModal
        allowedCurrencyCodes={allowedCurrencyCodes}
        // excludeWalletIds={getWalletIdsIfNotTokens()}
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
      />
    ))

    if (walletId != null && currencyCode != null) {
      navigation.setParams({ walletId })
    }
  }, [account, navigation])

  // Goes to the add token scene:
  const handleAdd = useCallback(() => {
    navigation.navigate('editToken', {
      walletId
    })
  }, [navigation, walletId])

  // Renders an individual token row within the list:
  const renderRow = useCallback(
    (item: FlatListItem<string>) => {
      const tokenId = item.item
      return (
        <ManageTokensRow
          // Scene stuff:
          navigation={navigation}
          wallet={wallet}
          // Token stuff:
          isCustom={customTokens[tokenId] != null}
          isEnabled={enabledTokenSet.has(tokenId)}
          token={allTokens[tokenId]}
          tokenId={item.item}
        />
      )
    },
    [allTokens, customTokens, enabledTokenSet, navigation, wallet]
  )

  return (
    <SceneWrapper>
      <SceneHeader underline>
        <TouchableOpacity onPress={handleSelectWallet}>
          <Title
            leftIcon={<CurrencyIcon sizeRem={1.5} walletId={wallet.id} />}
            rightIcon={<FontAwesomeIcon name="angle-right" size={theme.rem(2)} style={styles.rightIcon} />}
            text={walletName}
          />
        </TouchableOpacity>
        <EdgeText style={styles.subTitle}>{s.strings.managetokens_top_instructions}</EdgeText>
        <OutlinedTextInput
          label={s.strings.search_tokens}
          marginRem={[1, 2, 0, 1]}
          returnKeyType="search"
          searchIcon
          value={searchValue}
          onChangeText={setSearchValue}
        />
      </SceneHeader>
      <FlatList data={filteredTokenIds} extraData={allTokens} keyExtractor={keyExtractor} renderItem={renderRow} style={styles.tokenList} />
      {!isCustomTokensSupported ? null : (
        <>
          <DividerLine marginRem={[0, 1]} />
          <MainButton alignSelf="center" label={s.strings.addtoken_add} marginRem={1} type="secondary" onPress={handleAdd} />
        </>
      )}
    </SceneWrapper>
  )
}

const keyExtractor = tokenId => tokenId

const getStyles = cacheStyles((theme: Theme) => ({
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
