import { FlashList, ListRenderItem } from '@shopify/flash-list'
import * as React from 'react'
import { Switch, View } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { isKeysOnlyPlugin } from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { zeroString } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { WalletCreateItem } from '../themed/WalletList'

interface Props extends EdgeSceneProps<'migrateWalletSelectCrypto'> {}

export interface MigrateWalletItem extends WalletCreateItem {
  createWalletIds: [string]
}

const MigrateWalletSelectCryptoComponent = (props: Props) => {
  const { navigation, route } = props
  const { preSelectedWalletIds = [] } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const migrateWalletList = React.useMemo(() => {
    let list: MigrateWalletItem[] = []
    Object.keys(currencyWallets).forEach(walletId => {
      const wallet = currencyWallets[walletId]
      const {
        currencyInfo: { currencyCode, pluginId, walletType },
        currencyConfig: { allTokens },
        balances,
        enabledTokenIds
      } = wallet

      if (isKeysOnlyPlugin(pluginId)) return
      if (SPECIAL_CURRENCY_INFO[pluginId].isAccountActivationRequired) return // ignore activation required plugins
      if (pluginId === 'ripple') return // ignore currencies with token approval since they can't do bulk approvals

      const walletAssetList: MigrateWalletItem[] = []
      for (const [cc, bal] of Object.entries(balances)) {
        if (cc === currencyCode) {
          if (zeroString(bal)) return // ignore wallet
          walletAssetList.unshift({
            createWalletIds: [walletId],
            currencyCode: cc,
            displayName: getWalletName(wallet),
            key: walletId,
            pluginId: pluginId,
            walletType
          })
        } else {
          if (zeroString(bal)) continue // ignore token
          const tokenId = Object.keys(allTokens).find(tokenId => cc === allTokens[tokenId].currencyCode)

          if (tokenId == null || !enabledTokenIds.includes(tokenId)) continue // ignore token
          walletAssetList.push({
            createWalletIds: [walletId],
            currencyCode: cc,
            displayName: getWalletName(wallet),
            key: `${walletId}:${cc}`,
            pluginId: pluginId,
            tokenId,
            walletType
          })
        }
      }
      list = [...list, ...walletAssetList]
    })
    return list
  }, [currencyWallets])

  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(() => {
    const out: Set<string> = new Set()
    for (const migrateWalletItem of migrateWalletList) {
      if (preSelectedWalletIds.includes(migrateWalletItem.createWalletIds[0])) out.add(migrateWalletItem.key)
    }
    return out
  })

  const numSelected = selectedItems.size

  const handleCreateWalletToggle = useHandler((key: string) => {
    const copy = new Set(selectedItems)
    if (selectedItems.has(key)) copy.delete(key)
    else copy.add(key)
    setSelectedItems(copy)
  })

  const handleNext = useHandler(async () => {
    if (numSelected === 0) {
      showError(lstrings.create_wallet_no_assets_selected)
      return
    }

    const filteredMigrateWalletList = migrateWalletList.filter(item => selectedItems.has(item.key))
    navigation.push('migrateWalletCalculateFee', { migrateWalletList: filteredMigrateWalletList })
  })

  const renderCreateWalletRow: ListRenderItem<MigrateWalletItem> = useHandler(item => {
    const { key, displayName, pluginId, tokenId } = item.item

    const toggle = (
      <Switch
        ios_backgroundColor={theme.toggleButtonOff}
        trackColor={{
          false: theme.toggleButtonOff,
          true: theme.toggleButton
        }}
        value={selectedItems.has(key)}
        onValueChange={() => handleCreateWalletToggle(key)}
      />
    )

    return (
      <CreateWalletSelectCryptoRow
        pluginId={pluginId}
        tokenId={tokenId}
        walletName={displayName}
        onPress={() => handleCreateWalletToggle(key)}
        rightSide={toggle}
      />
    )
  })

  const renderNextButton = React.useMemo(
    () => (
      <Fade noFadeIn={numSelected > 0} visible={numSelected > 0} duration={300}>
        <View style={{ position: 'absolute', bottom: '1%', alignSelf: 'center' }}>
          <MainButton label={lstrings.string_next_capitalized} type="primary" marginRem={[0.5, -0.5]} onPress={handleNext} alignSelf="center" />
        </View>
      </Fade>
    ),
    [handleNext, numSelected]
  )

  const keyExtractor = useHandler((item: MigrateWalletItem) => item.key)

  return (
    <SceneWrapper background="theme">
      {gap => (
        <View style={[styles.content, { marginBottom: -gap.bottom }]}>
          <SceneHeader title={lstrings.migrate_wallets_select_crypto_title} withTopMargin />
          <FlashList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{ paddingBottom: gap.bottom, paddingTop: theme.rem(0.5) }}
            data={migrateWalletList}
            estimatedItemSize={theme.rem(4.25)}
            extraData={selectedItems}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderCreateWalletRow}
          />
          {renderNextButton}
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1
  }
}))

export const MigrateWalletSelectCryptoScene = React.memo(MigrateWalletSelectCryptoComponent)
