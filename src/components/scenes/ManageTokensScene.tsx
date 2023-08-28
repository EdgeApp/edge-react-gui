import { FlashList } from '@shopify/flash-list'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'

import { PREFERRED_TOKENS, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { ButtonsContainer } from '../buttons/ButtonsContainer'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { ManageTokensRow } from '../themed/ManageTokensRow'
import { OutlinedTextInput } from '../themed/OutlinedTextInput'
import { SceneHeader } from '../themed/SceneHeader'
import { Title } from '../themed/Title'

interface Props extends EdgeSceneProps<'manageTokens'> {
  wallet: EdgeCurrencyWallet
}

function ManageTokensSceneComponent(props: Props) {
  const { navigation, wallet } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const walletName = useWalletName(wallet)
  const isCustomTokensSupported = SPECIAL_CURRENCY_INFO[wallet.currencyInfo.pluginId]?.isCustomTokensSupported ?? false

  const [searchValue, setSearchValue] = React.useState('')

  // Subscribe to the account's token lists:
  const { currencyConfig } = wallet
  const allTokens = useWatch(currencyConfig, 'allTokens')
  const customTokens = useWatch(currencyConfig, 'customTokens')

  // Subscribe to the wallet's enabled tokens:
  const enabledTokenIds = useWatch(wallet, 'enabledTokenIds')

  // Optimize the enabled tokens:
  const enabledTokenSet = React.useMemo(() => new Set(enabledTokenIds), [enabledTokenIds])

  // Sort the token list:
  const sortedTokenIds = React.useMemo(() => {
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
  const filteredTokenIds = React.useMemo(() => {
    const target = normalizeForSearch(searchValue)
    return sortedTokenIds.filter(tokenId => {
      const token = allTokens[tokenId]
      const currencyCode = normalizeForSearch(token.currencyCode)
      const displayName = normalizeForSearch(token.displayName)
      return currencyCode.includes(target) || displayName.includes(target)
    })
  }, [allTokens, searchValue, sortedTokenIds])

  // Goes to the add token scene:
  const handleAdd = useHandler(() => {
    navigation.navigate('editToken', {
      walletId: wallet.id
    })
  })

  // Renders an individual token row within the list:
  const renderRow = useHandler((item: FlatListItem<string>) => {
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
  })

  const extraData = React.useMemo(() => ({ allTokens, enabledTokenSet, customTokens }), [allTokens, enabledTokenSet, customTokens])

  return (
    <SceneWrapper>
      <SceneHeader underline>
        <Title leftIcon={<CryptoIcon sizeRem={1.5} walletId={wallet.id} />} text={walletName} />
        <EdgeText style={styles.subTitle}>{lstrings.managetokens_top_instructions}</EdgeText>
        <OutlinedTextInput
          label={lstrings.search_tokens}
          marginRem={[1, 0, 0, 0]}
          returnKeyType="search"
          searchIcon
          value={searchValue}
          onChangeText={setSearchValue}
        />
      </SceneHeader>
      <FlashList estimatedItemSize={theme.rem(4.25)} data={filteredTokenIds} extraData={extraData} keyExtractor={keyExtractor} renderItem={renderRow} />
      {!isCustomTokensSupported ? null : (
        <>
          <DividerLine marginRem={[0, 1]} />
          {/* TODO: Remove extra padding in ThemedModal so we don't need to compensate margins with this View */}
          <View style={styles.buttonsContainer}>
            <ButtonsContainer
              primary={{ label: lstrings.string_next_capitalized, onPress: navigation.goBack }}
              secondary={{ label: lstrings.addtoken_add, onPress: handleAdd }}
              layout="column"
            />
          </View>
        </>
      )}
    </SceneWrapper>
  )
}

const keyExtractor = (tokenId: string) => tokenId

const getStyles = cacheStyles((theme: Theme) => ({
  buttonsContainer: { marginHorizontal: theme.rem(0.5) },
  rightIcon: {
    color: theme.iconTappable,
    marginRight: theme.rem(1)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  }
}))

export const ManageTokensScene = withWallet(ManageTokensSceneComponent)
