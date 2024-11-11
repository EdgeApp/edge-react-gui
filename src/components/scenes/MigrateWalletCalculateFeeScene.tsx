import { add, lt } from 'biggystring'
import { asMaybeInsufficientFundsError, EdgeDenomination, EdgeSpendInfo, EdgeTransaction, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { getFirstOpenInfo } from '../../actions/FirstOpenActions'
import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeAppSceneProps, NavigationBase } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertTransactionFeeToDisplayFee, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { Airship, showToast } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'
import { MigrateWalletItem } from './MigrateWalletSelectCryptoScene'

export interface MigrateWalletCalculateFeeParams {
  migrateWalletList: MigrateWalletItem[]
}

interface Props extends EdgeAppSceneProps<'migrateWalletCalculateFee'> {}

type AssetRowState = string | Error

const MigrateWalletCalculateFeeComponent = (props: Props) => {
  const { navigation, route } = props
  const { migrateWalletList } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const account = useSelector(state => state.core.account)
  const exchangeRates = useSelector(state => state.exchangeRates)
  const displayDenominations = useSelector(state => {
    const { denominationSettings = {} } = state.ui.settings
    return denominationSettings
  })
  const isoFiatCurrencyCode = useSelector(state => state.ui.settings.defaultIsoFiat)

  const currencyWallets = useWatch(account, 'currencyWallets')

  const mounted = React.useRef<boolean>(true)

  const [feeState, setFeeState] = React.useState<Map<string, AssetRowState | undefined>>(new Map())
  const [sliderDisabled, setSliderDisabled] = React.useState(true)
  const [migrateWalletsSynced, setMigrateWalletsSynced] = React.useState(false)

  const renderCurrencyRow = useHandler((data: ListRenderItemInfo<MigrateWalletItem>) => {
    const { key, pluginId, tokenId, walletType, createWalletIds } = data.item
    if (walletType == null) return null

    const walletId = createWalletIds[0]
    const wallet = currencyWallets[walletId]
    if (wallet == null) return null
    const {
      currencyInfo: { currencyCode, denominations }
    } = wallet
    const walletName = getWalletName(wallet)
    const fee = feeState.get(key)

    let rightSide: JSX.Element
    if (fee == null || !migrateWalletsSynced) {
      rightSide = <ActivityIndicator style={{ paddingRight: theme.rem(0.3125) }} color={theme.iconTappable} />
    } else if (fee instanceof Error) {
      rightSide = <EdgeText style={{ color: theme.negativeText, fontSize: theme.rem(0.75) }}>{fee.message}</EdgeText>

      if (fee instanceof InsufficientFundsError) {
        return (
          <CreateWalletSelectCryptoRow
            pluginId={pluginId}
            tokenId={tokenId}
            walletName={walletName}
            rightSide={rightSide}
            onPress={async () => {
              await handleInsufficientFunds(wallet, fee)
            }}
          />
        )
      }
    } else {
      const fakeEdgeTransaction: EdgeTransaction = {
        blockHeight: 0,
        currencyCode,
        date: 0,
        memos: [],
        isSend: true,
        nativeAmount: '0',
        networkFee: fee,
        ourReceiveAddresses: [],
        signedTx: '',
        tokenId: null,
        txid: '',
        walletId
      }
      const exchangeDenom = denominations.find(denom => denom.name === currencyCode) as EdgeDenomination
      const displayDenom = displayDenominations[pluginId]?.[currencyCode] ?? exchangeDenom

      const transactionFee = convertTransactionFeeToDisplayFee(
        wallet.currencyInfo.currencyCode,
        isoFiatCurrencyCode,
        exchangeRates,
        fakeEdgeTransaction,
        displayDenom,
        exchangeDenom
      )
      const fiatAmount = transactionFee.fiatAmount === '0' ? '0' : ` ${transactionFee.fiatAmount}`
      const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${truncateDecimals(transactionFee.cryptoAmount)} (${
        transactionFee.fiatSymbol ?? ''
      }${fiatAmount})`
      rightSide = <EdgeText style={{ color: theme.secondaryText, fontSize: theme.rem(0.75) }}>{feeSyntax}</EdgeText>
    }

    return <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={tokenId} walletName={walletName} rightSide={rightSide} />
  })

  const handleInsufficientFunds = useHandler(async (wallet, error) => {
    const { countryCode } = await getFirstOpenInfo()
    await Airship.show(bridge => (
      <InsufficientFeesModal bridge={bridge} countryCode={countryCode} coreError={error} navigation={navigation as NavigationBase} wallet={wallet} />
    ))
  })

  const handleSlidingComplete = useHandler(() => {
    const filteredMigrateWalletList = migrateWalletList.filter(asset => typeof feeState.get(asset.key) === 'string')
    navigation.push('migrateWalletCompletion', { migrateWalletList: filteredMigrateWalletList })
  })

  // Create getMaxSpendable/makeSpend promises for each selected asset. We'll group them by wallet first and then execute all of them while keeping
  // track of which makeSpends are successful so we can enable the slider. A single failure from any of a wallet's assets will cast them all as failures.
  useAsyncEffect(
    async () => {
      if (!migrateWalletsSynced) return

      // This bundles the assets by similar walletId with the main asset (ie. ETH) at the end of each array so its makeSpend is called last
      const bundledWalletAssets: MigrateWalletItem[][] = migrateWalletList.reduce((bundles: MigrateWalletItem[][], asset) => {
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

      let successCount = 0
      const walletPromises = []
      for (const bundle of bundledWalletAssets) {
        const wallet = currencyWallets[bundle[bundle.length - 1].createWalletIds[0]]
        const {
          currencyInfo: { pluginId }
        } = wallet

        let feeTotal = '0'
        const bundlesFeeTotals: Map<string, AssetRowState> = new Map(bundle.map(item => [item.key, '0']))

        const assetPromises = bundle.map((asset, i) => {
          return async () => {
            const publicAddress = SPECIAL_CURRENCY_INFO[pluginId].dummyPublicAddress ?? (await wallet.getReceiveAddress({ tokenId: null })).publicAddress
            const spendInfo: EdgeSpendInfo = {
              tokenId: asset.tokenId,
              spendTargets: [{ publicAddress }],
              networkFeeOption: 'standard'
            }

            try {
              const maxAmount = await wallet.getMaxSpendable(spendInfo)
              if (maxAmount === '0') {
                throw new InsufficientFundsError({ tokenId: asset.tokenId })
              }
              const maxSpendInfo = { ...spendInfo, spendTargets: [{ publicAddress, nativeAmount: maxAmount }] }
              const edgeTransaction = await wallet.makeSpend(maxSpendInfo)
              const txFee = edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
              bundlesFeeTotals.set(asset.key, txFee)
              feeTotal = add(feeTotal, txFee)

              // While imperfect, sanity check that the total fee spent so far to send tokens + fee to send mainnet currency is under the total mainnet balance
              if (i === bundle.length - 1 && lt(wallet.balanceMap.get(null) ?? '0', feeTotal)) {
                throw new InsufficientFundsError({ tokenId: null, networkFee: feeTotal })
              }
            } catch (e: any) {
              for (const key of bundlesFeeTotals.keys()) {
                const insufficientFundsError = asMaybeInsufficientFundsError(e)
                if (insufficientFundsError != null) {
                  bundlesFeeTotals.set(key, e)
                } else {
                  bundlesFeeTotals.set(key, Error(lstrings.migrate_unknown_error_fragment))
                }
              }
            }
          }
        })

        walletPromises.push(async () => {
          for (const promise of assetPromises) {
            await promise()
          }

          const success = [...bundlesFeeTotals.values()].some(value => !(value instanceof Error))
          if (success) successCount++

          if (mounted.current) {
            setFeeState(prevState => new Map([...prevState, ...bundlesFeeTotals]))
          }
        })
      }

      await Promise.all(walletPromises.map(async promise => await promise()))

      if (mounted.current && successCount > 0) {
        setSliderDisabled(false)
      }

      return () => {
        mounted.current = false
      }
    },
    [migrateWalletsSynced],
    'MigrateWalletCalculateFeeComponent'
  )

  // Wait for wallets to sync
  React.useEffect(() => {
    const migrateWalletIds = migrateWalletList.map(item => item.createWalletIds[0])

    const updateProgress = () => {
      const syncedWallets = migrateWalletIds.filter(walletId => {
        const wallet = currencyWallets[walletId]

        return (
          // Count the number of wallets that are fully synced
          wallet.syncRatio >= 1
        )
      }).length

      if (syncedWallets === migrateWalletIds.length) {
        // HACK: Balances are not ready yet immediately after syncRatio === 1.
        // Wait a bit before checking for sufficient balances for fees.
        setTimeout(() => {
          setMigrateWalletsSynced(true)
        }, 5000)
      }
    }

    showToast(lstrings.fragment_transaction_list_tx_synchronizing)
    updateProgress()

    // Set up listeners for each wallet's syncRatio
    const unsubscribers = migrateWalletIds.map(walletId => {
      const wallet = currencyWallets[walletId]
      return wallet.watch('syncRatio', updateProgress)
    })

    // Clean up listeners when component unmounts or dependencies change
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }, [currencyWallets, migrateWalletList])

  const keyExtractor = useHandler((item: MigrateWalletItem) => item.key)

  return (
    <SceneWrapper>
      <View style={styles.content}>
        <SceneHeader title={lstrings.migrate_wallets_calculate_fee_title} withTopMargin />
        <EdgeText style={styles.instructionalText} numberOfLines={4}>
          {lstrings.migrate_wallet_instructions_fragment}
        </EdgeText>
        <FlatList
          automaticallyAdjustContentInsets={false}
          data={migrateWalletList}
          extraData={feeState}
          keyExtractor={keyExtractor}
          renderItem={renderCurrencyRow}
          scrollIndicatorInsets={SCROLL_INDICATOR_INSET_FIX}
          contentContainerStyle={{ marginHorizontal: theme.rem(0.5) }}
        />
        <SafeSlider
          parentStyle={{ marginTop: theme.rem(0.5), marginBottom: theme.rem(1) }}
          disabled={sliderDisabled}
          disabledText={lstrings.send_confirmation_slide_to_confirm}
          onSlidingComplete={handleSlidingComplete}
        />
      </View>
    </SceneWrapper>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  content: {
    flex: 1
  },
  instructionalText: {
    color: theme.primaryText,
    fontSize: theme.rem(0.75),
    paddingBottom: theme.rem(1),
    paddingHorizontal: theme.rem(1),
    paddingTop: theme.rem(0.5),
    textAlign: 'left'
  }
}))

export const MigrateWalletCalculateFeeScene = React.memo(MigrateWalletCalculateFeeComponent)
