import { add, lt, sub } from 'biggystring'
import {
  EdgeCurrencyWallet,
  EdgeSpendInfo,
  EdgeTransaction
} from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import IonIcon from 'react-native-vector-icons/Ionicons'
import { sprintf } from 'sprintf-js'

import {
  readSyncedSettings,
  writeSyncedSettings
} from '../../actions/SettingsActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { getSpecialCurrencyInfo } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertNativeToDenomination } from '../../util/utils'
import { SceneButtons } from '../buttons/SceneButtons'
import { SceneWrapper } from '../common/SceneWrapper'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { SceneHeader } from '../themed/SceneHeader'
import { MigrateWalletItem } from './MigrateWalletSelectCryptoScene'

export interface MigrateWalletCompletionParams {
  migrateWalletList: MigrateWalletItem[]
}

interface Props extends EdgeAppSceneProps<'migrateWalletCompletion'> {}

interface MigrateWalletTokenItem extends MigrateWalletItem {
  tokenId: string
}

const MigrateWalletCompletionComponent = (props: Props) => {
  const { navigation, route } = props
  const { migrateWalletList } = route.params

  const theme = useTheme()

  const account = useSelector(state => state.core.account)
  const defaultIsoFiat = useSelector(state => state.ui.settings.defaultIsoFiat)
  const currencyWallets = useWatch(account, 'currencyWallets')

  const sortedMigrateWalletListBundles = React.useMemo(() => {
    return migrateWalletList.reduce((bundles: MigrateWalletItem[][], asset) => {
      const { createWalletIds } = asset
      const walletId = createWalletIds[0]

      // Find the bundle with the main currency at the end of it
      const index = bundles.findIndex(
        bundle => walletId === bundle[0].createWalletIds[0]
      )

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
    return sortedMigrateWalletList.reduce(
      (map: { [key: string]: 'pending' | 'complete' | 'error' }, item) => {
        map[item.key] = 'pending'
        return map
      },
      {}
    )
  })

  const flatListRef = React.useRef<FlatList<MigrateWalletItem>>(null)

  const handleItemStatus = (
    item: MigrateWalletItem,
    status: 'complete' | 'error'
  ) => {
    setItemStatus(currentState => ({ ...currentState, [item.key]: status }))
    const index = sortedMigrateWalletList.findIndex(
      asset => asset.key === item.key
    )
    flatListRef.current?.scrollToIndex({
      animated: true,
      index,
      viewPosition: 0.5
    })
  }

  // Create the wallets and enable the tokens
  useAsyncEffect(
    async () => {
      const settings = await readSyncedSettings(account)
      const securityCheckedWallets = { ...settings.securityCheckedWallets }

      const migrationPromises = []
      for (const bundle of sortedMigrateWalletListBundles) {
        const mainnetItem = bundle[bundle.length - 1]
        const { createWalletIds } = mainnetItem
        const oldWalletId = createWalletIds[0]

        if (securityCheckedWallets[oldWalletId] == null) {
          securityCheckedWallets[oldWalletId] = {
            checked: false,
            modalShown: 0
          }
        }

        const oldWallet = currencyWallets[oldWalletId]
        const {
          currencyInfo: { walletType }
        } = oldWallet
        const oldWalletName = getWalletName(oldWallet)
        const newWalletName = `${oldWalletName}${lstrings.migrate_wallet_new_fragment}`

        // Create new wallet
        const createNewWalletPromise = async () => {
          const previouslyCreatedWalletInfo = account.allKeys.find(
            keys =>
              keys.migratedFromWalletId === oldWalletId &&
              !keys.archived &&
              !keys.deleted &&
              !keys.hidden
          )
          let newWallet =
            previouslyCreatedWalletInfo != null
              ? currencyWallets[previouslyCreatedWalletInfo.id]
              : undefined

          let createdNewWallet = false
          if (newWallet == null) {
            newWallet = await account.createCurrencyWallet(walletType, {
              name: newWalletName,
              fiatCurrencyCode: defaultIsoFiat,
              migratedFromWalletId: oldWalletId
            })
            createdNewWallet = true
          }

          // Change old wallet name
          if (createdNewWallet)
            await oldWallet.renameWallet(
              `${oldWalletName}${lstrings.migrate_wallet_old_fragment}`
            )

          const addressInfo = await newWallet.getReceiveAddress({
            tokenId: null
          })
          const newPublicAddress =
            addressInfo.segwitAddress ?? addressInfo.publicAddress

          const tokenItems = bundle.filter(
            (pair: any): pair is MigrateWalletTokenItem => pair.tokenId != null
          )

          // Enable tokens on new wallet
          const tokenIdsToEnable = [
            ...new Set([
              ...newWallet.enabledTokenIds,
              ...tokenItems.map(pair => pair.tokenId)
            ])
          ]
          await newWallet.changeEnabledTokenIds(tokenIdsToEnable)

          // Send tokens
          let feeTotal = '0'
          const hasError = false
          const successfullyTransferredTokenIds: string[] = []
          for (const item of tokenItems) {
            let tokenSpendInfo: EdgeSpendInfo = {
              tokenId: item.tokenId,
              spendTargets: [{ publicAddress: newPublicAddress }],
              networkFeeOption: 'standard'
            }
            try {
              const maxAmount = await oldWallet.getMaxSpendable(tokenSpendInfo)
              tokenSpendInfo = {
                ...tokenSpendInfo,
                spendTargets: [
                  { ...tokenSpendInfo.spendTargets[0], nativeAmount: maxAmount }
                ]
              }
              const tx = await makeSpendSignAndBroadcast(
                oldWallet,
                tokenSpendInfo
              )
              successfullyTransferredTokenIds.push(item.tokenId)
              const txFee = tx.parentNetworkFee ?? tx.networkFee
              feeTotal = add(feeTotal, txFee)

              handleItemStatus(item, 'complete')
            } catch (e: any) {
              handleItemStatus(item, 'error')
            }
          }

          // Disable empty tokens
          await oldWallet.changeEnabledTokenIds(
            tokenIdsToEnable.filter(
              tokenId => !successfullyTransferredTokenIds.includes(tokenId)
            )
          )

          if (!hasError) {
            // Send mainnet
            let spendInfo: EdgeSpendInfo = {
              tokenId: null,
              spendTargets: [{ publicAddress: newPublicAddress }],
              metadata: {
                category: 'Transfer',
                name: newWalletName,
                notes: sprintf(lstrings.migrate_wallet_tx_notes, newWalletName)
              },
              networkFeeOption: 'standard'
            }
            try {
              const maxAmount = await oldWallet.getMaxSpendable(spendInfo)
              spendInfo = {
                ...spendInfo,
                spendTargets: [
                  { ...spendInfo.spendTargets[0], nativeAmount: maxAmount }
                ]
              }
              const amountToSend = sub(maxAmount, feeTotal)

              // Validate that the new wallet will have sufficient balance after
              // migration to meet minimum balance requirements
              const { currencyInfo } = newWallet
              const specialCurrencyInfo = getSpecialCurrencyInfo(
                currencyInfo.pluginId
              )
              const minimumNativeBalance =
                specialCurrencyInfo.minimumPopupModals?.minimumNativeBalance ??
                '0'

              if (lt(amountToSend, minimumNativeBalance)) {
                const denom = currencyInfo.denominations.find(
                  d => d.name === currencyInfo.currencyCode
                )
                if (denom != null) {
                  const exchangeAmount = convertNativeToDenomination(
                    denom.multiplier
                  )(minimumNativeBalance)
                  throw new Error(
                    sprintf(
                      lstrings.migrate_wallet_below_minimum_balance_2s,
                      exchangeAmount,
                      currencyInfo.currencyCode
                    )
                  )
                }
              }

              spendInfo = {
                ...spendInfo,
                spendTargets: [
                  { ...spendInfo.spendTargets[0], nativeAmount: amountToSend }
                ]
              }
              await makeSpendSignAndBroadcast(oldWallet, spendInfo)
              handleItemStatus(mainnetItem, 'complete')

              const { modalShown } = securityCheckedWallets[oldWalletId]
              securityCheckedWallets[oldWalletId] = {
                checked: true,
                modalShown
              }
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
      await writeSyncedSettings(account, {
        ...settings,
        securityCheckedWallets
      })

      setDone(true)
      return () => {}
    },
    [],
    'MigrateWalletCompletionComponent'
  )

  const renderStatus = useHandler((item: MigrateWalletItem) => {
    let icon = (
      <ActivityIndicator
        style={{ paddingRight: theme.rem(0.3125) }}
        color={theme.iconTappable}
      />
    )
    if (itemStatus[item.key] === 'complete')
      icon = (
        <IonIcon
          name="checkmark-circle-outline"
          size={theme.rem(1.5)}
          color={theme.iconTappable}
        />
      )
    if (itemStatus[item.key] === 'error')
      icon = (
        <IonIcon
          name="warning-outline"
          style={{ paddingRight: theme.rem(0.0625) }}
          size={theme.rem(1.5)}
          color={theme.dangerText}
        />
      )
    return icon
  })

  const renderRow = useHandler(
    (data: ListRenderItemInfo<MigrateWalletItem>) => {
      const { item } = data
      const { createWalletIds } = item

      const walletId = createWalletIds[0]
      const wallet = currencyWallets[walletId]
      if (wallet == null) return null
      return (
        <CreateWalletSelectCryptoRow
          pluginId={item.pluginId}
          tokenId={item.tokenId}
          walletName={getWalletName(wallet)}
          rightSide={renderStatus(item)}
        />
      )
    }
  )

  const keyExtractor = useHandler((item: MigrateWalletItem) => item.key)

  return (
    <SceneWrapper>
      {({ insetStyle, undoInsetStyle }) => (
        <View style={{ ...undoInsetStyle, marginTop: 0 }}>
          <SceneHeader title={lstrings.migrate_wallets_title} withTopMargin />
          <FlatList
            automaticallyAdjustContentInsets={false}
            data={sortedMigrateWalletList}
            contentContainerStyle={{
              ...insetStyle,
              paddingTop: 0,
              paddingBottom: insetStyle.paddingBottom + theme.rem(5),
              marginHorizontal: theme.rem(0.5)
            }}
            extraData={itemStatus}
            fadingEdgeLength={10}
            keyExtractor={keyExtractor}
            ref={flatListRef}
            renderItem={renderRow}
            scrollEnabled={done}
            scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          />
          <SceneButtons
            primary={{
              label: lstrings.string_done_cap,
              disabled: !done,
              onPress: () =>
                navigation.navigate('edgeTabs', {
                  screen: 'walletsTab',
                  params: { screen: 'walletList' }
                })
            }}
          />
        </View>
      )}
    </SceneWrapper>
  )
}

const makeSpendSignAndBroadcast = async (
  wallet: EdgeCurrencyWallet,
  spendInfo: EdgeSpendInfo
): Promise<EdgeTransaction> => {
  const edgeUnsignedTransaction = await wallet.makeSpend(spendInfo)
  const edgeSignedTransaction = await wallet.signTx(edgeUnsignedTransaction)
  const edgeBroadcastedTransaction = await wallet.broadcastTx(
    edgeSignedTransaction
  )
  await wallet.saveTx(edgeBroadcastedTransaction)
  return edgeBroadcastedTransaction
}

export const MigrateWalletCompletionScene = React.memo(
  MigrateWalletCompletionComponent
)
