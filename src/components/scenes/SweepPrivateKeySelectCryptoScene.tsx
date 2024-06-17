import { EdgeCurrencyWallet, EdgeMemoryWallet } from 'edge-core-js'
import * as React from 'react'
import { ListRenderItemInfo, Switch, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { Fade } from '../themed/Fade'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { SweepPrivateKeyItem } from './SweepPrivateKeyProcessingScene'

export interface SweepPrivateKeySelectCryptoParams {
  memoryWallet: EdgeMemoryWallet
  receivingWallet: EdgeCurrencyWallet
  sweepPrivateKeyList: SweepPrivateKeyItem[]
}

interface Props extends EdgeSceneProps<'sweepPrivateKeySelectCrypto'> {}

const SweepPrivateKeySelectCryptoComponent = (props: Props) => {
  const { navigation, route } = props
  const { memoryWallet, receivingWallet, sweepPrivateKeyList } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const {
    currencyConfig: { allTokens },
    currencyInfo: { displayName: mainnetDisplayName, pluginId }
  } = receivingWallet

  const [selectedItems, setSelectedItems] = React.useState<Set<string>>(() => {
    const out: Set<string> = new Set()
    for (const sweepPrivateKeyItem of sweepPrivateKeyList) {
      out.add(sweepPrivateKeyItem.key)
    }
    return out
  })

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', ev => {
      memoryWallet.close().catch(() => {})
    })
    return unsubscribe
  }, [memoryWallet, navigation])

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

    const filteredSweepPrivateKeyList = sweepPrivateKeyList.filter(item => selectedItems.has(item.key))
    navigation.push('sweepPrivateKeyCalculateFee', {
      memoryWallet,
      receivingWallet,
      sweepPrivateKeyList: filteredSweepPrivateKeyList
    })
  })

  const renderCreateWalletRow = useHandler((item: ListRenderItemInfo<SweepPrivateKeyItem>) => {
    const { key, tokenId } = item.item
    const displayName = tokenId == null ? mainnetDisplayName : allTokens[tokenId].displayName

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

  const keyExtractor = useHandler((item: SweepPrivateKeyItem) => item.key)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.sweep_private_key_select_crypto_title} withTopMargin />
          <FlatList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{
              ...insetStyle,
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom + theme.rem(5),
              marginHorizontal: theme.rem(0.5)
            }}
            data={sweepPrivateKeyList}
            extraData={selectedItems}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            renderItem={renderCreateWalletRow}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
          <Fade noFadeIn={numSelected > 0} visible={numSelected > 0} duration={300}>
            <View style={styles.bottomButton}>
              <MainButton label={lstrings.string_next_capitalized} type="primary" marginRem={[0, 0, 0.75]} onPress={handleNext} />
            </View>
          </Fade>
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

export const SweepPrivateKeySelectCryptoScene = React.memo(SweepPrivateKeySelectCryptoComponent)
