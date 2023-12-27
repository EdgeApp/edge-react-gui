import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { add, sub } from 'biggystring'
import { EdgeCurrencyWallet, EdgeSpendInfo, EdgeTransaction } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import { readSyncedSettings, writeSyncedSettings } from '../../actions/SettingsActions'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { MainButton } from '../themed/MainButton'
import { SceneHeader } from '../themed/SceneHeader'
import { MigrateWalletItem } from './MigrateWalletSelectCryptoScene'

interface Props extends EdgeSceneProps<'migrateWalletCompletion'> {}

interface MigrateWalletTokenItem extends MigrateWalletItem {
  tokenId: string
}

const MigrateWalletCompletionComponent = (props: Props) => {
  const { navigation, route } = props
  const { migrateWalletList } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const sortedMigrateWalletListBundles = React.useMemo(() => {
    return migrateWalletList.reduce((bundles: MigrateWalletItem[][], asset) => {
      const { createWalletIds } = asset
      const walletId = createWalletIds[0]

      // Find the bundle with the main currency at the end of it
      const index = bundles.findIndex(bundle => walletId === bundle[0].createWalletIds[0])

      if (index === -1) {
        bundles.push([asset]) // create bundle for this walletId
      } else {
        if (asset.tokenId != null) {
          bundles[index].unshift(asset) // add token in front
        } else {
          bundles[index].push(asset) // mainnet to the back of the line
        }
      }

      return bundles
    }, [])
  }, [migrateWalletList])

  const sortedMigrateWalletList = React.useMemo(() => {
    return sortedMigrateWalletListBundles.flat()
  }, [sortedMigrateWalletListBundles])

  const [done, setDone] = React.useState(false)

  // State to manage row status icons
  const [itemStatus, setItemStatus] = React.useState(() => {
    return sortedMigrateWalletList.reduce((map: { [key: string]: 'pending' | 'complete' | 'error' }, item) => {
      map[item.key] = 'pending'
      return map
    }, {})
  })

  const flatListRef = React.useRef<FlashList<MigrateWalletItem>>(null)

  const handleItemStatus = (item: MigrateWalletItem, status: 'complete' | 'error') => {
    setItemStatus(currentState => ({ ...currentState, [item.key]: status }))
    const index = sortedMigrateWalletList.findIndex(asset => asset.key === item.key)
    flatListRef.current?.scrollToIndex({ animated: true, index, viewPosition: 0.5 })
  }

  // Create the wallets and enable the tokens
  useAsyncEffect(async () => {
    const settings = await readSyncedSettings(account)
    const securityCheckedWallets = { ...settings.securityCheckedWallets }

    const migrationPromises = []
    for (const bundle of sortedMigrateWalletListBundles) {
      const mainnetItem = bundle[bundle.length - 1]
      const { createWalletIds } = mainnetItem
      const oldWalletId = createWalletIds[0]

      if (securityCheckedWallets[oldWalletId] == null) {
        securityCheckedWallets[oldWalletId] = { checked: false, modalShown: 0 }
      }

      const oldWallet = currencyWallets[oldWalletId]
      const {
        currencyInfo: { walletType },
        fiatCurrencyCode
      } = oldWallet
      const oldWalletName = getWalletName(oldWallet)
      const newWalletName = `${oldWalletName}${lstrings.migrate_wallet_new_fragment}`

      // Create new wallet
      const createNewWalletPromise = async () => {
        const previouslyCreatedWalletInfo = account.allKeys.find(
          keys => keys.migratedFromWalletId === oldWalletId && !keys.archived && !keys.deleted && !keys.hidden
        )
        let newWallet = previouslyCreatedWalletInfo != null ? currencyWallets[previouslyCreatedWalletInfo.id] : undefined

        let createdNewWallet = false
        if (newWallet == null) {
          newWallet = await account.createCurrencyWallet(walletType, {
            name: newWalletName,
            fiatCurrencyCode,
            migratedFromWalletId: oldWalletId
          })
          createdNewWallet = true
        }

        // Change old wallet name
        if (createdNewWallet) await oldWallet.renameWallet(`${oldWalletName}${lstrings.migrate_wallet_old_fragment}`)

        const addressInfo = await newWallet.getReceiveAddress()
        const newPublicAddress = addressInfo.segwitAddress ?? addressInfo.publicAddress

        const tokenItems = bundle.filter((pair: any): pair is MigrateWalletTokenItem => pair.tokenId != null)

        // Enable tokens on new wallet
        const tokenIdsToEnable = [...new Set([...newWallet.enabledTokenIds, ...tokenItems.map(pair => pair.tokenId)])]
        await newWallet.changeEnabledTokenIds(tokenIdsToEnable)

        // Send tokens
        let feeTotal = '0'
        const hasError = false
        const pendingTxs: EdgeTransaction[] = []
        const successfullyTransferredTokenIds: string[] = []
        for (const item of tokenItems) {
          let tokenSpendInfo: EdgeSpendInfo = {
            currencyCode: item.currencyCode,
            spendTargets: [{ publicAddress: newPublicAddress }],
            pendingTxs,
            networkFeeOption: 'standard'
          }
          try {
            const maxAmount = await oldWallet.getMaxSpendable(tokenSpendInfo)
            tokenSpendInfo = { ...tokenSpendInfo, spendTargets: [{ ...tokenSpendInfo.spendTargets[0], nativeAmount: maxAmount }] }
            const tx = await makeSpendSignAndBroadcast(oldWallet, tokenSpendInfo)
            successfullyTransferredTokenIds.push(item.tokenId)
            const txFee = tx.parentNetworkFee ?? tx.networkFee
            feeTotal = add(feeTotal, txFee)
            pendingTxs.push(tx)

            handleItemStatus(item, 'complete')
          } catch (e: any) {
            handleItemStatus(item, 'error')
          }
        }

        // Disable empty tokens
        await oldWallet.changeEnabledTokenIds(tokenIdsToEnable.filter(tokenId => !successfullyTransferredTokenIds.includes(tokenId)))

        if (!hasError) {
          // Send mainnet
          let spendInfo: EdgeSpendInfo = {
            currencyCode: oldWallet.currencyInfo.currencyCode,
            spendTargets: [{ publicAddress: newPublicAddress }],
            metadata: {
              category: 'Transfer',
              name: newWalletName,
              notes: sprintf(lstrings.migrate_wallet_tx_notes, newWalletName)
            },
            pendingTxs,
            networkFeeOption: 'standard'
          }
          try {
            const maxAmount = await oldWallet.getMaxSpendable(spendInfo)
            spendInfo = { ...spendInfo, spendTargets: [{ ...spendInfo.spendTargets[0], nativeAmount: maxAmount }] }
            const amountToSend = sub(maxAmount, feeTotal)
            spendInfo = { ...spendInfo, spendTargets: [{ ...spendInfo.spendTargets[0], nativeAmount: amountToSend }] }
            await makeSpendSignAndBroadcast(oldWallet, spendInfo)
            handleItemStatus(mainnetItem, 'complete')

            const { modalShown } = securityCheckedWallets[oldWalletId]
            securityCheckedWallets[oldWalletId] = { checked: true, modalShown }
          } catch (e) {
            showError(e)
            handleItemStatus(mainnetItem, 'error')
          }
        } else {
          handleItemStatus(mainnetItem, 'error')
        }
      }
      migrationPromises.push(createNewWalletPromise)
    }

    for (const migration of migrationPromises) {
      await migration()
    }
    await writeSyncedSettings(account, { ...settings, securityCheckedWallets })

    setDone(true)
    return () => {}
  }, [])

  const renderStatus = useHandler((item: MigrateWalletItem) => {
    let icon = <ActivityIndicator style={{ paddingRight: theme.rem(0.3125) }} color={theme.iconTappable} />
    if (itemStatus[item.key] === 'complete') icon = <IonIcon name="checkmark-circle-outline" size={theme.rem(1.5)} color={theme.iconTappable} />
    if (itemStatus[item.key] === 'error')
      icon = <IonIcon name="warning-outline" style={{ paddingRight: theme.rem(0.0625) }} size={theme.rem(1.5)} color={theme.dangerText} />
    return icon
  })

  const renderRow: ListRenderItem<MigrateWalletItem> = useHandler(data => {
    const { item } = data
    const { createWalletIds } = item

    const walletId = createWalletIds[0]
    const wallet = currencyWallets[walletId]
    if (wallet == null) return null
    return <CreateWalletSelectCryptoRow pluginId={item.pluginId} tokenId={item.tokenId} walletName={getWalletName(wallet)} rightSide={renderStatus(item)} />
  })

  const renderNextButton = React.useMemo(() => {
    return (
      <MainButton
        spinner={!done}
        disabled={!done}
        label={!done ? undefined : lstrings.string_done_cap}
        type="secondary"
        marginRem={[1]}
        onPress={() => navigation.navigate('walletsTab', { screen: 'walletList' })}
        alignSelf="center"
      />
    )
  }, [done, navigation])

  const keyExtractor = useHandler((item: MigrateWalletItem) => item.key)

  return (
    <SceneWrapper background="theme">
      {gap => (
        <View style={[styles.content, { marginBottom: -gap.bottom }]}>
          <SceneHeader title={lstrings.migrate_wallets_title} withTopMargin />
          <FlashList
            automaticallyAdjustContentInsets={false}
            contentContainerStyle={{ paddingBottom: gap.bottom, paddingTop: theme.rem(0.5) }}
            data={sortedMigrateWalletList}
            estimatedItemSize={theme.rem(4.25)}
            extraData={itemStatus}
            fadingEdgeLength={10}
            keyExtractor={keyExtractor}
            ref={flatListRef}
            renderItem={renderRow}
            scrollEnabled={done}
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

const makeSpendSignAndBroadcast = async (wallet: EdgeCurrencyWallet, spendInfo: EdgeSpendInfo): Promise<EdgeTransaction> => {
  const edgeUnsignedTransaction = await wallet.makeSpend(spendInfo)
  const edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
  const edgeBroadcastedTransaction = await wallet.broadcastTx(edgeSignedTransaction)
  await wallet.saveTx(edgeBroadcastedTransaction)
  return edgeBroadcastedTransaction
}

export const MigrateWalletCompletionScene = React.memo(MigrateWalletCompletionComponent)
