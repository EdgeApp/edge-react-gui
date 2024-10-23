import { add } from 'biggystring'
import { EdgeCurrencyWallet, EdgeMemoryWallet, EdgeTokenId, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'

export interface SweepPrivateKeyCompletionParams {
  memoryWallet: EdgeMemoryWallet
  receivingWallet: EdgeCurrencyWallet
  unsignedEdgeTransactions: EdgeTransaction[]
}

interface Props extends EdgeAppSceneProps<'sweepPrivateKeyCompletion'> {}

const SweepPrivateKeyCompletionComponent = (props: Props) => {
  const { navigation, route } = props
  const { memoryWallet, receivingWallet, unsignedEdgeTransactions } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const [done, setDone] = React.useState(false)

  // State to manage row status icons
  const [itemStatus, setItemStatus] = React.useState(() => {
    const itemStatusMap = new Map<EdgeTokenId, 'pending' | 'complete' | 'error'>()
    for (const tx of unsignedEdgeTransactions) {
      itemStatusMap.set(tx.tokenId, 'pending')
    }
    return itemStatusMap
  })

  const flatListRef = React.useRef<FlatList<EdgeTransaction>>(null)

  const handleTxStatus = (tx: EdgeTransaction, status: 'complete' | 'error') => {
    setItemStatus(currentState => {
      const newState = new Map(currentState)
      newState.set(tx.tokenId, status)
      return newState
    })
    const index = unsignedEdgeTransactions.findIndex(asset => asset.tokenId === tx.tokenId)
    flatListRef.current?.scrollToIndex({ animated: true, index, viewPosition: 0.5 })
  }

  // Sweep the funds and enable the tokens
  useAsyncEffect(
    async () => {
      const mainnetTransaction = unsignedEdgeTransactions[unsignedEdgeTransactions.length - 1]
      const tokenTransactions = unsignedEdgeTransactions.filter(tx => tx.tokenId != null)

      // Send tokens
      let feeTotal = '0'
      let hasError = false
      const successfullyTransferredTokenIds: EdgeTokenId[] = []
      for (const unsignedTx of tokenTransactions) {
        try {
          const tx = await signBroadcastAndSave(memoryWallet, unsignedTx)
          successfullyTransferredTokenIds.push(tx.tokenId)
          const txFee = tx.parentNetworkFee ?? tx.networkFee
          feeTotal = add(feeTotal, txFee)
          handleTxStatus(tx, 'complete')
        } catch (e: any) {
          handleTxStatus(unsignedTx, 'error')
          hasError = true
        }
      }

      if (!hasError) {
        // Send mainnet
        try {
          const tx = await signBroadcastAndSave(memoryWallet, mainnetTransaction)
          handleTxStatus(tx, 'complete')
        } catch (e) {
          showError(e)
          handleTxStatus(mainnetTransaction, 'error')
        }
      } else {
        handleTxStatus(mainnetTransaction, 'error')
      }

      const tokenIdList = new Set(receivingWallet.enabledTokenIds)
      for (const tokenId of successfullyTransferredTokenIds) {
        if (tokenId == null) continue
        tokenIdList.add(tokenId)
      }
      await receivingWallet.changeEnabledTokenIds([...tokenIdList])

      setDone(true)
      await memoryWallet.close()
      return () => {}
    },
    [],
    'SweepPrivateKeyCompletionComponent'
  )

  const renderStatus = useHandler((tx: EdgeTransaction) => {
    let icon = <ActivityIndicator style={{ paddingRight: theme.rem(0.3125) }} color={theme.iconTappable} />
    if (itemStatus.get(tx.tokenId) === 'complete') icon = <IonIcon name="checkmark-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
    if (itemStatus.get(tx.tokenId) === 'error')
      icon = <IonIcon name="warning-outline" style={{ paddingRight: theme.rem(0.0625) }} size={theme.rem(1.5)} color={theme.dangerText} />
    return icon
  })

  const renderRow = useHandler((data: ListRenderItemInfo<EdgeTransaction>) => {
    const { item } = data

    return (
      <CreateWalletSelectCryptoRow
        pluginId={receivingWallet.currencyInfo.pluginId}
        tokenId={item.tokenId}
        walletName={getWalletName(receivingWallet)}
        rightSide={renderStatus(item)}
      />
    )
  })

  const renderNextButton = React.useMemo(() => {
    return (
      <View style={styles.bottomButton}>
        <MainButton
          spinner={!done}
          disabled={!done}
          label={!done ? undefined : lstrings.string_done_cap}
          type="secondary"
          marginRem={[0, 0, 1]}
          onPress={() => navigation.navigate('edgeTabs', { screen: 'walletsTab', params: { screen: 'walletList' } })}
        />
      </View>
    )
  }, [done, navigation, styles.bottomButton])

  const keyExtractor = useHandler((tx: EdgeTransaction) => tx.walletId + tx.tokenId)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.drawer_sweep_private_key} withTopMargin />
          <FlatList
            automaticallyAdjustContentInsets={false}
            data={unsignedEdgeTransactions}
            contentContainerStyle={{ ...insetStyle, paddingTop: 0, paddingBottom: insetStyle.paddingBottom + theme.rem(5), marginHorizontal: theme.rem(0.5) }}
            extraData={itemStatus}
            fadingEdgeLength={10}
            keyExtractor={keyExtractor}
            ref={flatListRef}
            renderItem={renderRow}
            scrollEnabled={done}
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

const signBroadcastAndSave = async (wallet: EdgeMemoryWallet, unsignedSignedTransaction: EdgeTransaction): Promise<EdgeTransaction> => {
  const edgeSignedTransaction = await wallet.signTx(unsignedSignedTransaction)
  const edgeBroadcastedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
  await wallet.saveTx(edgeBroadcastedTransaction)
  return edgeBroadcastedTransaction
}

export const SweepPrivateKeyCompletionScene = React.memo(SweepPrivateKeyCompletionComponent)
