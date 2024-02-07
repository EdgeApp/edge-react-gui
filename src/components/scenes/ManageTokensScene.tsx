import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { PREFERRED_TOKENS, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'
import { ManageTokensRow } from '../themed/ManageTokensRow'
import { SceneHeader } from '../themed/SceneHeader'
import { Title } from '../themed/Title'
import { ButtonsViewUi4 } from '../ui4/ButtonsViewUi4'
import { CryptoIconUi4 } from '../ui4/CryptoIconUi4'

export interface ManageTokensParams {
  walletId: string
}

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
    const preferredIdSet = new Set<string>()
    for (const currencyCode of PREFERRED_TOKENS) {
      const tokenId = Object.keys(allTokens).find(tokenId => allTokens[tokenId].currencyCode === currencyCode)
      if (tokenId != null) preferredIdSet.add(tokenId)
    }

    return Object.keys(allTokens).sort((id1, id2) => {
      const token1 = allTokens[id1]
      const token2 = allTokens[id2]

      const isToken1Enabled = enabledTokenSet.has(id1)
      const isToken2Enabled = enabledTokenSet.has(id2)
      const isToken1Preferred = preferredIdSet.has(id1)
      const isToken2Preferred = preferredIdSet.has(id2)

      // Sort enabled tokens first
      if (isToken1Enabled && !isToken2Enabled) return -1
      if (!isToken1Enabled && isToken2Enabled) return 1

      // Then sort preferred tokens
      if (isToken1Preferred && !isToken2Preferred) return -1
      if (!isToken1Preferred && isToken2Preferred) return 1

      // Finally, sort by currency code
      if (token1.currencyCode < token2.currencyCode) return -1
      if (token1.currencyCode > token2.currencyCode) return 1
      return 0
    })
  }, [allTokens, enabledTokenSet])

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
        <Title leftIcon={<CryptoIconUi4 sizeRem={1.5} tokenId={null} walletId={wallet.id} />} text={walletName} />
        <EdgeText style={styles.subTitle}>{lstrings.managetokens_top_instructions}</EdgeText>
        <FilledTextInput
          top={1}
          placeholder={lstrings.search_tokens}
          returnKeyType="search"
          iconComponent={SearchIconAnimated}
          value={searchValue}
          onChangeText={setSearchValue}
        />
      </SceneHeader>
      <FlatList data={filteredTokenIds} extraData={extraData} keyExtractor={keyExtractor} renderItem={renderRow} />
      {!isCustomTokensSupported ? null : (
        <>
          <DividerLine marginRem={[0, 1]} />
          {/* TODO: Create a layout enum in ButtonsViewUi4 for this persistent button area */}
          <View style={styles.buttonsContainer}>
            <ButtonsViewUi4
              primary={{ label: lstrings.string_done_cap, onPress: navigation.goBack }}
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
  buttonsContainer: { marginTop: theme.rem(1), marginBottom: theme.rem(1) },
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
