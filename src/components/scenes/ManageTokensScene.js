// @flow

import * as React from 'react'
import { FlatList } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome'

import { PREFERRED_TOKENS, SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants.js'
import { useHandler } from '../../hooks/useHandler.js'
import { useRowLayout } from '../../hooks/useRowLayout.js'
import { useWalletName } from '../../hooks/useWalletName.js'
import { useWatchCurrencyConfig, useWatchWallet } from '../../hooks/useWatch.js'
import s from '../../locales/strings.js'
import { useMemo, useState } from '../../types/reactHooks.js'
import { useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type EdgeTokenId, type FlatListItem } from '../../types/types.js'
import { normalizeForSearch } from '../../util/utils.js'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { CryptoIcon } from '../icons/CryptoIcon.js'
import { WalletListModal } from '../modals/WalletListModal.js'
import { Airship } from '../services/AirshipInstance.js'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
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
  const { currencyConfig } = wallet
  const allTokens = useWatchCurrencyConfig(currencyConfig, 'allTokens')
  const customTokens = useWatchCurrencyConfig(currencyConfig, 'customTokens')

  // Subscribe to the wallet's enabled tokens:
  const enabledTokenIds = useWatchWallet(wallet, 'enabledTokenIds')

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
  const handleSelectWallet = useHandler(async () => {
    const allowedAssets: EdgeTokenId[] = Object.keys(account.currencyConfig)
      .filter(pluginId => SPECIAL_CURRENCY_INFO[pluginId]?.isCustomTokensSupported)
      .map(pluginId => ({ pluginId }))

    const { walletId, currencyCode } = await Airship.show(bridge => (
      <WalletListModal allowedAssets={allowedAssets} bridge={bridge} headerTitle={s.strings.select_wallet} />
    ))

    if (walletId != null && currencyCode != null) {
      navigation.setParams({ walletId })
    }
  })

  // Goes to the add token scene:
  const handleAdd = useHandler(() => {
    navigation.navigate('editToken', {
      walletId
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

  const extraData = useMemo(() => ({ allTokens, enabledTokenSet, customTokens }), [allTokens, enabledTokenSet, customTokens])
  const handleItemLayout = useRowLayout()

  const sceneHeader = useMemo(
    () => (
      <SceneHeader underline>
        <TouchableOpacity onPress={handleSelectWallet}>
          <Title
            leftIcon={<CryptoIcon sizeRem={1.5} walletId={wallet.id} />}
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
    ),
    [handleSelectWallet, searchValue, styles.rightIcon, styles.subTitle, theme, wallet.id, walletName]
  )

  return (
    <SceneWrapper>
      {sceneHeader}
      <FlatList
        getItemLayout={handleItemLayout}
        data={filteredTokenIds}
        extraData={extraData}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        style={styles.tokenList}
      />
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
