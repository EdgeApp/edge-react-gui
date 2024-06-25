import { add, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeMemoryWallet, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { SweepPrivateKeyItem } from './SweepPrivateKeyProcessingScene'

export interface SweepPrivateKeyCompletionParams {
  memoryWallet: EdgeMemoryWallet
  receivingWallet: EdgeCurrencyWallet
  sweepPrivateKeyList: SweepPrivateKeyItem[]
}

interface Props extends EdgeSceneProps<'sweepPrivateKeyCompletion'> {}

interface SweepPrivateKeyTokenItem extends SweepPrivateKeyItem {
  tokenId: string
}

const SweepPrivateKeyCompletionComponent = (props: Props) => {
  const { navigation, route } = props
  const { memoryWallet, receivingWallet, sweepPrivateKeyList } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const sortedSweepPrivateKeyList = React.useMemo(() => {
    const sortedSweepPrivateKeyList: SweepPrivateKeyItem[] = []
    const mainnetItemIndex = sweepPrivateKeyList.findIndex(item => item.tokenId == null)
    for (const [i, item] of sweepPrivateKeyList.entries()) {
      if (i === mainnetItemIndex) {
        sortedSweepPrivateKeyList.push(item)
      } else {
        sortedSweepPrivateKeyList.unshift(item)
      }
    }
    return sortedSweepPrivateKeyList
  }, [sweepPrivateKeyList])

  const [done, setDone] = React.useState(false)

  // State to manage row status icons
  const [itemStatus, setItemStatus] = React.useState(() => {
    return sortedSweepPrivateKeyList.reduce((map: { [key: string]: 'pending' | 'complete' | 'error' }, item) => {
      map[item.key] = 'pending'
      return map
    }, {})
  })

  const flatListRef = React.useRef<FlatList<SweepPrivateKeyItem>>(null)

  const handleItemStatus = (item: SweepPrivateKeyItem, status: 'complete' | 'error') => {
    setItemStatus(currentState => ({ ...currentState, [item.key]: status }))
    const index = sortedSweepPrivateKeyList.findIndex(asset => asset.key === item.key)
    flatListRef.current?.scrollToIndex({ animated: true, index, viewPosition: 0.5 })
  }

  // Sweep the funds and enable the tokens
  useAsyncEffect(
    async () => {
      const mainnetItem = sortedSweepPrivateKeyList[sortedSweepPrivateKeyList.length - 1]

      const sweepPrivateKeyPromise = async () => {
        const addressInfo = await receivingWallet.getReceiveAddress({ tokenId: null })
        const publicAddress = addressInfo.segwitAddress ?? addressInfo.publicAddress

        const tokenItems = sortedSweepPrivateKeyList.filter((pair: any): pair is SweepPrivateKeyTokenItem => pair.tokenId != null)

        // Enable tokens on receiving wallet
        const tokenIdsToEnable = [...new Set([...receivingWallet.enabledTokenIds, ...tokenItems.map(pair => pair.tokenId)])]
        await receivingWallet.changeEnabledTokenIds(tokenIdsToEnable)

        // Send tokens
        let feeTotal = '0'
        let hasError = false
        const successfullyTransferredTokenIds: string[] = []
        const pendingTxs: EdgeTransaction[] = []
        for (const item of tokenItems) {
          let tokenSpendInfo: EdgeSpendInfo = {
            tokenId: item.tokenId,
            spendTargets: [{ publicAddress }],
            networkFeeOption: 'standard',
            pendingTxs
          }
          try {
            const maxAmount = await memoryWallet.getMaxSpendable(tokenSpendInfo)
            tokenSpendInfo = { ...tokenSpendInfo, spendTargets: [{ ...tokenSpendInfo.spendTargets[0], nativeAmount: maxAmount }] }
            const tx = await makeSpendSignAndBroadcast(memoryWallet, tokenSpendInfo)
            successfullyTransferredTokenIds.push(item.tokenId)
            pendingTxs.push(tx)
            const txFee = tx.parentNetworkFee ?? tx.networkFee
            feeTotal = add(feeTotal, txFee)

            handleItemStatus(item, 'complete')
          } catch (e: any) {
            handleItemStatus(item, 'error')
            hasError = true
          }
        }

        if (!hasError) {
          // Send mainnet
          let spendInfo: EdgeSpendInfo = {
            tokenId: null,
            spendTargets: [{ publicAddress }],
            networkFeeOption: 'standard',
            pendingTxs
          }
          try {
            const maxAmount = await memoryWallet.getMaxSpendable(spendInfo)
            spendInfo = { ...spendInfo, spendTargets: [{ ...spendInfo.spendTargets[0], nativeAmount: maxAmount }] }
            const amountToSend = sub(maxAmount, feeTotal)
            spendInfo = { ...spendInfo, spendTargets: [{ ...spendInfo.spendTargets[0], nativeAmount: amountToSend }] }
            await makeSpendSignAndBroadcast(memoryWallet, spendInfo)
            handleItemStatus(mainnetItem, 'complete')
          } catch (e) {
            showError(e)
            handleItemStatus(mainnetItem, 'error')
          }
        } else {
          handleItemStatus(mainnetItem, 'error')
        }

        const tokenIdList = new Set(receivingWallet.enabledTokenIds)
        for (const tokenId of successfullyTransferredTokenIds) {
          tokenIdList.add(tokenId)
        }
        await receivingWallet.changeEnabledTokenIds([...tokenIdList])
      }

      await sweepPrivateKeyPromise()

      setDone(true)
      await memoryWallet.close()
      return () => {}
    },
    [],
    'SweepPrivateKeyCompletionComponent'
  )

  const renderStatus = useHandler((item: SweepPrivateKeyItem) => {
    let icon = <ActivityIndicator style={{ paddingRight: theme.rem(0.3125) }} color={theme.iconTappable} />
    if (itemStatus[item.key] === 'complete') icon = <IonIcon name="checkmark-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
    if (itemStatus[item.key] === 'error')
      icon = <IonIcon name="warning-outline" style={{ paddingRight: theme.rem(0.0625) }} size={theme.rem(1.5)} color={theme.dangerText} />
    return icon
  })

  const renderRow = useHandler((data: ListRenderItemInfo<SweepPrivateKeyItem>) => {
    const { item } = data

    return (
      <CreateWalletSelectCryptoRow pluginId={item.pluginId} tokenId={item.tokenId} walletName={getWalletName(receivingWallet)} rightSide={renderStatus(item)} />
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
          onPress={() => navigation.navigate('walletsTab', { screen: 'walletList' })}
        />
      </View>
    )
  }, [done, navigation, styles.bottomButton])

  const keyExtractor = useHandler((item: SweepPrivateKeyItem) => item.key)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.drawer_sweep_private_key} withTopMargin />
          <FlatList
            automaticallyAdjustContentInsets={false}
            data={sortedSweepPrivateKeyList}
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

const makeSpendSignAndBroadcast = async (wallet: EdgeMemoryWallet, spendInfo: EdgeSpendInfo): Promise<EdgeTransaction> => {
  const edgeUnsignedTransaction = await wallet.makeSpend(spendInfo)
  const edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
  const edgeBroadcastedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
  await wallet.saveTx(edgeBroadcastedTransaction)
  return edgeBroadcastedTransaction
}

export const SweepPrivateKeyCompletionScene = React.memo(SweepPrivateKeyCompletionComponent)
