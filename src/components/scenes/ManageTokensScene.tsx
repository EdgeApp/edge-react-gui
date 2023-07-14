import { FlashList } from '@shopify/flash-list'
import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { TouchableOpacity } from 'react-native-gesture-handler'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { PREFERRED_TOKENS, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWalletName } from '../../hooks/useWalletName'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { EdgeTokenId, FlatListItem } from '../../types/types'
import { normalizeForSearch } from '../../util/utils'
import { ButtonInfo, ButtonsContainer } from '../buttons/ButtonsContainer'
import { SceneWrapper } from '../common/SceneWrapper'
import { withWallet } from '../hoc/withWallet'
import { CryptoIcon } from '../icons/CryptoIcon'
import { WalletListModal, WalletListResult } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { DividerLine } from '../themed/DividerLine'
import { EdgeText } from '../themed/EdgeText'
import { MainButtonType } from '../themed/MainButton'
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
  const account = useSelector(state => state.core.account)
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

  // Shows the wallet picker modal:
  const handleSelectWallet = useHandler(async () => {
    const allowedAssets: EdgeTokenId[] = Object.keys(account.currencyConfig)
      .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported)
      .map(pluginId => ({ pluginId }))

    const { walletId, currencyCode } = await Airship.show<WalletListResult>(bridge => (
      <WalletListModal allowedAssets={allowedAssets} bridge={bridge} headerTitle={lstrings.select_wallet} navigation={navigation} />
    ))

    if (walletId != null && currencyCode != null) {
      navigation.setParams({ walletId })
    }
  })

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
        <TouchableOpacity onPress={handleSelectWallet}>
          <Title
            leftIcon={<CryptoIcon sizeRem={1.5} walletId={wallet.id} />}
            rightIcon={<FontAwesomeIcon name="angle-right" size={theme.rem(2)} style={styles.rightIcon} />}
            text={walletName}
          />
        </TouchableOpacity>
        <EdgeText style={styles.subTitle}>{lstrings.managetokens_top_instructions}</EdgeText>
        <OutlinedTextInput
          label={lstrings.search_tokens}
          marginRem={[1, 2, 0, 1]}
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
          <ButtonsContainer
            primary={{ label: lstrings.string_next_capitalized, onPress: navigation.goBack }}
            secondary={{ label: lstrings.addtoken_add, onPress: handleAdd }}
            layout="row"
          />
        </>
      )}
    </SceneWrapper>
  )
}

const keyExtractor = (tokenId: string) => tokenId

const getStyles = cacheStyles((theme: Theme) => ({
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
