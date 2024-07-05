import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { SectionList, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { PREFERRED_TOKENS } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useRowLayout } from '../../hooks/useRowLayout'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { FlatListItem } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { ButtonsView } from '../buttons/ButtonsView'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { SearchIconAnimated } from '../icons/ThemedIcons'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { FilledTextInput } from '../themed/FilledTextInput'
import { ManageTokensRow } from '../themed/ManageTokensRow'
import { SceneHeader } from '../themed/SceneHeader'
import { Title } from '../themed/Title'
import { WalletListSectionHeader } from '../themed/WalletListSectionHeader'

/**
 * walletId: ID of the wallet whose tokens we are managing
 * newTokenIds: We routed from a notification that was triggered from detecting
 * these new tokenIds having nonzero balance. Show these at the top of the list.
 */
export interface ManageTokensParams {
  walletId: string
  newTokenIds?: string[]
}

interface Section {
  title: string
  data: string[]
}

interface Props extends EdgeSceneProps<'manageTokens'> {
  wallet: EdgeCurrencyWallet
}

function ManageTokensSceneComponent(props: Props) {
  const { navigation, route, wallet } = props
  const { newTokenIds } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const walletName = useWalletName(wallet)

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

  // Split the list of tokens based on if there were auto-detected tokens given
  const autoDetectedTokenIds = React.useMemo(
    () => (newTokenIds ? filteredTokenIds.filter(filteredTokenId => newTokenIds.includes(filteredTokenId)) : []),
    [filteredTokenIds, newTokenIds]
  )

  const extraData = React.useMemo(() => ({ allTokens, enabledTokenSet, customTokens }), [allTokens, enabledTokenSet, customTokens])

  const sectionList = React.useMemo<Section[] | null>(() => {
    if (autoDetectedTokenIds.length === 0) {
      return null // Non-sectioned list off raw tokenIds
    } else {
      return [
        {
          title: lstrings.managetokens_detected_tokens_header,
          data: autoDetectedTokenIds
        },
        {
          title: lstrings.managetokens_all_tokens_header,

          // Omit the auto-detected tokens we're already showing above
          data: filteredTokenIds.filter(filteredTokenId => !autoDetectedTokenIds.includes(filteredTokenId))
        }
      ]
    }
  }, [autoDetectedTokenIds, filteredTokenIds])

  const handleItemLayout = useRowLayout()

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
        tokenId={tokenId}
      />
    )
  })

  // Render a section header
  const renderSectionHeader = useHandler((section: { section: Section }) => {
    return <WalletListSectionHeader title={section.section.title} />
  })

  return (
    <SceneWrapper>
      <SceneHeader underline>
        <Title leftIcon={<CryptoIcon sizeRem={1.5} tokenId={null} walletId={wallet.id} />} text={walletName} />
        <EdgeText style={styles.subTitle}>{lstrings.managetokens_top_instructions}</EdgeText>
        <FilledTextInput
          topRem={1}
          placeholder={lstrings.search_tokens}
          returnKeyType="search"
          iconComponent={SearchIconAnimated}
          value={searchValue}
          onChangeText={setSearchValue}
        />
      </SceneHeader>
      {sectionList == null ? (
        <FlatList data={filteredTokenIds} extraData={extraData} keyExtractor={keyExtractor} renderItem={renderRow} style={styles.list} />
      ) : (
        <SectionList
          getItemLayout={handleItemLayout}
          extraData={extraData}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={renderRow}
          renderSectionHeader={renderSectionHeader}
          sections={sectionList}
          style={styles.sectionList}
        />
      )}
      {wallet.currencyInfo.customTokenTemplate == null ? null : (
        <>
          <DividerLine marginRem={[0, 1]} />
          {/* TODO: Create a layout enum in ButtonsViewUi4 for this persistent button area */}
          <View style={styles.buttonsContainer}>
            <ButtonsView
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
  list: {
    marginHorizontal: theme.rem(0.5)
  },
  rightIcon: {
    color: theme.iconTappable,
    marginRight: theme.rem(1)
  },
  subTitle: {
    color: theme.secondaryText,
    fontSize: theme.rem(0.85)
  },
  sectionList: {
    marginTop: theme.rem(1),
    marginHorizontal: theme.rem(0.5)
  }
}))

export const ManageTokensScene = withWallet(ManageTokensSceneComponent)
