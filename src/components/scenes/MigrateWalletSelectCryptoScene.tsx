import * as React from 'react'
import { type ListRenderItemInfo, Switch, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import type { WalletCreateItem } from '../../selectors/getCreateWalletList'
import { useSelector } from '../../types/reactRedux'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
import {
  getCurrencyCode,
  isKeysOnlyPlugin
} from '../../util/CurrencyInfoHelpers'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { zeroString } from '../../util/utils'
import { EdgeAnim } from '../common/EdgeAnim'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

export interface MigrateWalletSelectCryptoParams {
  preSelectedWalletIds?: string[]
}

interface Props extends EdgeAppSceneProps<'migrateWalletSelectCrypto'> {}

export interface MigrateWalletItem extends WalletCreateItem {
  createWalletIds: [string]
}

const MigrateWalletSelectCryptoComponent: React.FC<Props> = props => {
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
        currencyInfo: { pluginId, walletType },
        balanceMap,
        enabledTokenIds
      } = wallet

      if (isKeysOnlyPlugin(pluginId)) return
      if (SPECIAL_CURRENCY_INFO[pluginId].isAccountActivationRequired === true)
        return // ignore activation required plugins
      if (pluginId === 'ripple') return // ignore currencies with token approval since they can't do bulk approvals

      const walletAssetList: MigrateWalletItem[] = []
      for (const [tokenId, bal] of Array.from(balanceMap.entries())) {
        if (zeroString(bal)) continue // ignore token
        if (tokenId != null && !enabledTokenIds.includes(tokenId)) continue // ignore token
        const currencyCode = getCurrencyCode(wallet, tokenId)
        walletAssetList.push({
          type: 'create',
          createWalletIds: [walletId],
          currencyCode,
          displayName: getWalletName(wallet),
          key: `${walletId}:${tokenId ?? 'PARENT_TOKEN'}`,
          pluginId,
          tokenId,
          walletType
        })
      }
      list = [...list, ...walletAssetList]
    })
    return list
  }, [currencyWallets])

  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(() => {
    const out = new Set<string>()
    for (const migrateWalletItem of migrateWalletList) {
      if (preSelectedWalletIds.includes(migrateWalletItem.createWalletIds[0]))
        out.add(migrateWalletItem.key)
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

    const filteredMigrateWalletList = migrateWalletList.filter(item =>
      selectedItems.has(item.key)
    )
    navigation.push('migrateWalletCalculateFee', {
      migrateWalletList: filteredMigrateWalletList
    })
  })

  const renderCreateWalletRow = useHandler(
    (item: ListRenderItemInfo<MigrateWalletItem>) => {
      const { key, displayName, pluginId, tokenId } = item.item

      const toggle = (
        <Switch
          ios_backgroundColor={theme.toggleButtonOff}
          trackColor={{
            false: theme.toggleButtonOff,
            true: theme.toggleButton
          }}
          value={selectedItems.has(key)}
          onValueChange={() => {
            handleCreateWalletToggle(key)
          }}
        />
      )

      return (
        <CreateWalletSelectCryptoRow
          pluginId={pluginId}
          tokenId={tokenId}
          walletName={displayName}
          onPress={() => {
            handleCreateWalletToggle(key)
          }}
          rightSide={toggle}
        />
      )
    }
  )

  const renderNextButton = React.useMemo(
    () => (
      <EdgeAnim
        style={styles.bottomButton}
        enter={{ type: 'fadeIn', duration: 300 }}
        exit={{ type: 'fadeOut', duration: 300 }}
        visible={numSelected > 0}
      >
        <MainButton
          label={lstrings.string_next_capitalized}
          type="primary"
          marginRem={[0, 0, 0.75]}
          onPress={handleNext}
        />
      </EdgeAnim>
    ),
    [handleNext, numSelected, styles.bottomButton]
  )

  const keyExtractor = useHandler((item: MigrateWalletItem) => item.key)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader
            title={lstrings.migrate_wallets_select_crypto_title}
            withTopMargin
          />
          <FlatList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{
              ...insetStyle,
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom + theme.rem(5),
              marginHorizontal: theme.rem(0.5)
            }}
            data={migrateWalletList}
            extraData={selectedItems}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderCreateWalletRow}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
          {renderNextButton}
        </View>
      )}
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  bottomButton: {
    alignSelf: 'center',
    bottom: theme.rem(1),
    position: 'absolute'
  }
}))

export const MigrateWalletSelectCryptoScene = React.memo(
  MigrateWalletSelectCryptoComponent
)
