// @flow

import type { EdgeMetaToken } from 'edge-core-js'
import { difference, keys, union } from 'lodash'
import * as React from 'react'
import { FlatList, View } from 'react-native'

import { approveTokenTerms } from '../../actions/TokenTermsActions.js'
import { setWalletEnabledTokens } from '../../actions/WalletActions'
import { getSpecialCurrencyInfo, PREFERRED_TOKENS } from '../../constants/WalletAndCurrencyConstants.js'
import s from '../../locales/strings.js'
import { useState } from '../../types/reactHooks.js'
import { useDispatch, useSelector } from '../../types/reactRedux.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { type CustomTokenInfo, asSafeDefaultGuiWallet } from '../../types/types.js'
import { mergeTokensRemoveInvisible } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper.js'
import { WalletListModal } from '../modals/WalletListModal'
import { Airship } from '../services/AirshipInstance'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext.js'
import { DividerLine } from '../themed/DividerLine'
import { MainButton } from '../themed/MainButton.js'
import { ManageTokensHeader } from '../themed/ManageTokensHeader'
import { ManageTokensRow } from '../themed/ManageTokensRow'
import { SceneHeader } from '../themed/SceneHeader'
import { getCurrencyIcon } from './../../util/CurrencyInfoHelpers'

type Props = {
  navigation: NavigationProp<'manageTokens'>,
  route: RouteProp<'manageTokens'>
}

export function ManageTokensScene(props: Props) {
  const { navigation, route } = props
  const { walletId } = route.params

  const dispatch = useDispatch()
  const theme = useTheme()
  const styles = getStyles(theme)

  const [tokensToEnable, setTokensToEnable] = useState([])
  const [tokensToDisable, setTokensToDisable] = useState([])
  const [searchValue, setSearchValue] = useState('')

  const disklet = useSelector(state => state.core.disklet)
  const manageTokensPending = useSelector(state => state.ui.wallets.manageTokensPending)
  const customTokens = useSelector(state => state.ui.settings.customTokens)
  const wallets = useSelector(state => state.ui.wallets.byId)
  const currencyWallets = useSelector(state => state.core.account.currencyWallets)
  const enabledTokens = useSelector(state => asSafeDefaultGuiWallet(state.ui.wallets.byId[walletId]).enabledTokens)

  const { metaTokens, type, name, currencyCode } = wallets[walletId]
  const { pluginId } = currencyWallets[walletId].currencyInfo

  function getTokens(): EdgeMetaToken[] {
    const specialCurrencyInfo = getSpecialCurrencyInfo(pluginId)

    const accountMetaTokenInfo: CustomTokenInfo[] = specialCurrencyInfo.isCustomTokensSupported ? [...customTokens] : []

    const filteredTokenInfo = accountMetaTokenInfo.filter(token => {
      return token.walletType === type || token.walletType === undefined
    })

    const combinedTokenInfo = mergeTokensRemoveInvisible(metaTokens, filteredTokenInfo)

    const sortedTokenInfo = combinedTokenInfo.sort((a, b) => {
      if (a.currencyCode < b.currencyCode) return -1
      if (a === b) return 0
      return 1
    })

    // put preferred tokens at the top
    for (const cc of PREFERRED_TOKENS) {
      const idx = sortedTokenInfo.findIndex(e => e.currencyCode === cc)
      if (idx > -1) {
        const tokenInfo = sortedTokenInfo[idx]
        sortedTokenInfo.splice(idx, 1)
        sortedTokenInfo.unshift(tokenInfo)
      }
    }

    return sortedTokenInfo
  }

  function getAllowedWalletCurrencyCodes(): string[] {
    return keys(wallets).reduce((acc, key: string) => {
      const wallet = wallets[key]
      const isKey = acc.length > 0 && acc.includes(wallet.currencyCode)

      if (wallet.metaTokens.length > 0 && !isKey) {
        acc.push(wallet.currencyCode)
      }

      return acc
    }, [])
  }

  function getWalletIdsIfNotTokens(): string[] {
    return keys(wallets).filter((key: string) => wallets[key].metaTokens.length === 0)
  }

  const onSelectWallet = async () => {
    const { walletId, currencyCode } = await Airship.show(bridge => (
      <WalletListModal
        allowedCurrencyCodes={getAllowedWalletCurrencyCodes()}
        excludeWalletIds={getWalletIdsIfNotTokens()}
        bridge={bridge}
        headerTitle={s.strings.select_wallet}
      />
    ))

    if (walletId && currencyCode) {
      navigation.setParams({ walletId })
    }
  }

  const toggleToken = (currencyCode: string, enable: boolean) => {
    if (enable) {
      setTokensToEnable(union(tokensToEnable, [currencyCode]))
      setTokensToDisable(difference(tokensToDisable, [currencyCode]))
    } else {
      setTokensToEnable(difference(tokensToEnable, [currencyCode]))
      setTokensToDisable(union(tokensToDisable, [currencyCode]))
    }
  }

  const getFilteredTokens = (): EdgeMetaToken[] => {
    const tokens = getTokens()

    const RegexObj = new RegExp(searchValue, 'i')
    return tokens.filter(({ currencyCode, currencyName }) => RegexObj.test(currencyCode) || RegexObj.test(currencyName))
  }

  const saveEnabledTokenList = async () => {
    const newEnabledTokens = difference(union(tokensToEnable, enabledTokens), tokensToDisable)
    if (newEnabledTokens.length > 0) await approveTokenTerms(disklet, currencyCode)

    dispatch(setWalletEnabledTokens(walletId, newEnabledTokens, []))
    navigation.goBack()
  }

  const goToAddTokenScene = () => {
    navigation.navigate('addToken', {
      walletId
    })
  }

  const goToEditTokenScene = (currencyCode: string) => {
    navigation.navigate('editToken', {
      walletId,
      currencyCode,
      metaTokens
    })
  }

  if (wallets[walletId] == null || currencyWallets[walletId] == null) return null
  const tempEnabledTokens = difference(union(tokensToEnable, enabledTokens), tokensToDisable)

  return (
    <SceneWrapper>
      <SceneHeader underline>
        <ManageTokensHeader
          walletName={name}
          walletId={walletId}
          currencyCode={currencyCode}
          changeSearchValue={setSearchValue}
          onSelectWallet={onSelectWallet}
          searchValue={searchValue}
        />
      </SceneHeader>
      <FlatList
        keyExtractor={item => item.currencyCode}
        data={getFilteredTokens()}
        renderItem={metaToken => (
          <ManageTokensRow
            goToEditTokenScene={goToEditTokenScene}
            metaToken={metaToken}
            walletId={walletId}
            symbolImage={getCurrencyIcon(pluginId, metaToken.item.contractAddress).symbolImage}
            toggleToken={toggleToken}
            enabledList={tempEnabledTokens}
            metaTokens={metaTokens}
          />
        )}
        style={styles.tokensArea}
      />
      <DividerLine marginRem={[0, 1]} />
      <View style={styles.buttonsArea}>
        <View style={styles.buttonWrapper}>
          <MainButton label={s.strings.string_save} marginRem={0.5} spinner={manageTokensPending} type="secondary" onPress={saveEnabledTokenList} />
        </View>
        <View style={styles.buttonWrapper}>
          <MainButton label={s.strings.addtoken_add} marginRem={0.5} type="secondary" onPress={goToAddTokenScene} />
        </View>
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  tokensArea: {
    marginTop: theme.rem(-0.5),
    flex: 4
  },
  buttonWrapper: {
    flex: 1
  },
  buttonsArea: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'center',
    padding: theme.rem(0.5)
  }
}))
