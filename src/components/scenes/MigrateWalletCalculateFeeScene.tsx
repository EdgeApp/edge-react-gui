import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { add, lt } from 'biggystring'
import { EdgeDenomination, EdgeSpendInfo, EdgeTransaction, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, View } from 'react-native'

import { SPECIAL_CURRENCY_INFO } from '../../constants/WalletAndCurrencyConstants'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { getWalletName } from '../../util/CurrencyWalletHelpers'
import { convertTransactionFeeToDisplayFee, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'
import { MigrateWalletItem } from './MigrateWalletSelectCryptoScene'

interface Props extends EdgeSceneProps<'migrateWalletCalculateFee'> {}

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
  const currencyWallets = useWatch(account, 'currencyWallets')

  const mounted = React.useRef<boolean>(true)

  const [feeState, setFeeState] = React.useState<Map<string, AssetRowState | undefined>>(new Map())
  const [sliderDisabled, setSliderDisabled] = React.useState(true)

  const renderCurrencyRow: ListRenderItem<MigrateWalletItem> = useHandler(data => {
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
    if (fee == null) {
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
        txid: '',
        walletId
      }
      const exchangeDenom = denominations.find(denom => denom.name === currencyCode) as EdgeDenomination
      const displayDenom = displayDenominations[pluginId]?.[currencyCode] ?? exchangeDenom

      const transactionFee = convertTransactionFeeToDisplayFee(wallet, exchangeRates, fakeEdgeTransaction, displayDenom, exchangeDenom)
      const fiatAmount = transactionFee.fiatAmount === '0' ? '0' : ` ${transactionFee.fiatAmount}`
      const feeSyntax = `${transactionFee.cryptoSymbol ?? ''} ${truncateDecimals(transactionFee.cryptoAmount)} (${
        transactionFee.fiatSymbol ?? ''
      }${fiatAmount})`
      rightSide = <EdgeText style={{ color: theme.secondaryText, fontSize: theme.rem(0.75) }}>{feeSyntax}</EdgeText>
    }

    return <CreateWalletSelectCryptoRow pluginId={pluginId} tokenId={tokenId} walletName={walletName} rightSide={rightSide} />
  })

  const handleInsufficientFunds = useHandler(async (wallet, error) => {
    await Airship.show(bridge => <InsufficientFeesModal bridge={bridge} coreError={error} navigation={navigation} wallet={wallet} />)
  })

  const handleSlidingComplete = useHandler(() => {
    const filteredMigrateWalletList = migrateWalletList.filter(asset => typeof feeState.get(asset.key) === 'string')
    navigation.push('migrateWalletCompletion', { migrateWalletList: filteredMigrateWalletList })
  })

  // Create getMaxSpendable/makeSpend promises for each selected asset. We'll group them by wallet first and then execute all of them while keeping
  // track of which makeSpends are successful so we can enable the slider. A single failure from any of a wallet's assets will cast them all as failures.
  useAsyncEffect(async () => {
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
          const publicAddress = SPECIAL_CURRENCY_INFO[pluginId].dummyPublicAddress ?? (await wallet.getReceiveAddress()).publicAddress
          const spendInfo: EdgeSpendInfo = {
            currencyCode: asset.currencyCode,
            spendTargets: [{ publicAddress }],
            networkFeeOption: 'standard'
          }

          try {
            const maxAmount = await wallet.getMaxSpendable(spendInfo)
            if (maxAmount === '0') {
              throw new InsufficientFundsError({ currencyCode: asset.currencyCode })
            }
            const maxSpendInfo = { ...spendInfo, spendTargets: [{ publicAddress, nativeAmount: maxAmount }] }
            const edgeTransaction = await wallet.makeSpend(maxSpendInfo)
            const txFee = edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
            bundlesFeeTotals.set(asset.key, txFee)
            feeTotal = add(feeTotal, txFee)

            // While imperfect, sanity check that the total fee spent so far to send tokens + fee to send mainnet currency is under the total mainnet balance
            if (i === bundle.length - 1 && lt(wallet.balances[wallet.currencyInfo.currencyCode], feeTotal)) {
              throw new InsufficientFundsError({ currencyCode: asset.currencyCode, networkFee: feeTotal })
            }
          } catch (e: any) {
            for (const key of bundlesFeeTotals.keys()) {
              if (e instanceof InsufficientFundsError) {
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
  }, [])

  const keyExtractor = useHandler((item: MigrateWalletItem) => item.key)

  return (
    <SceneWrapper background="theme">
      <View style={styles.content}>
        <SceneHeader title={lstrings.migrate_wallets_calculate_fee_title} withTopMargin />
        <EdgeText style={styles.instructionalText} numberOfLines={4}>
          {lstrings.migrate_wallet_instructions_fragment}
        </EdgeText>
        <FlashList
          automaticallyAdjustContentInsets={false}
          data={migrateWalletList}
          estimatedItemSize={theme.rem(4.25)}
          extraData={feeState}
          keyExtractor={keyExtractor}
          renderItem={renderCurrencyRow}
        />
        <SafeSlider
          parentStyle={{ marginTop: theme.rem(0.5), marginBottom: theme.rem(1) }}
          disabled={sliderDisabled}
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
  cryptoTypeLogo: {
    width: theme.rem(2),
    height: theme.rem(2),
    borderRadius: theme.rem(1),
    marginLeft: theme.rem(0.25),
    backgroundColor: theme.backgroundGradientColors[1]
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
