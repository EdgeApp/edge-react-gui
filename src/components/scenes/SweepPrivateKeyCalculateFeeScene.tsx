import { add, lt } from 'biggystring'
import { asMaybeInsufficientFundsError, EdgeDenomination, EdgeMemoryWallet, EdgeSpendInfo, EdgeTransaction, InsufficientFundsError } from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { convertTransactionFeeToDisplayFee, truncateDecimals } from '../../util/utils'
import { SceneWrapper } from '../common/SceneWrapper'
import { InsufficientFeesModal } from '../modals/InsufficientFeesModal'
import { Airship } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { CreateWalletSelectCryptoRow } from '../themed/CreateWalletSelectCryptoRow'
import { EdgeText } from '../themed/EdgeText'
import { SafeSlider } from '../themed/SafeSlider'
import { SceneHeader } from '../themed/SceneHeader'
import { SweepPrivateKeyItem } from './SweepPrivateKeyProcessingScene'

export interface SweepPrivateKeyCalculateFeeParams {
  memoryWallet: EdgeMemoryWallet
  receivingWalletId: string
  sweepPrivateKeyList: SweepPrivateKeyItem[]
}

interface Props extends EdgeSceneProps<'sweepPrivateKeyCalculateFee'> {}

type AssetRowState = string | Error

const SweepPrivateKeyCalculateFeeComponent = (props: Props) => {
  const { navigation, route } = props
  const { memoryWallet, receivingWalletId, sweepPrivateKeyList } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)
  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const receivingWallet = currencyWallets[receivingWalletId]

  const exchangeRates = useSelector(state => state.exchangeRates)
  const displayDenominations = useSelector(state => {
    const { denominationSettings = {} } = state.ui.settings
    return denominationSettings
  })

  const mounted = React.useRef<boolean>(true)

  const [feeState, setFeeState] = React.useState<Map<string, AssetRowState | undefined>>(new Map())
  const [sliderDisabled, setSliderDisabled] = React.useState(true)

  const renderCurrencyRow = useHandler((data: ListRenderItemInfo<SweepPrivateKeyItem>) => {
    const { key, pluginId, tokenId } = data.item

    if (receivingWallet == null) return null
    const {
      currencyInfo: { currencyCode, denominations }
    } = receivingWallet
    const walletName = ''
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
            walletName=""
            rightSide={rightSide}
            onPress={async () => {
              await handleInsufficientFunds(receivingWallet, fee)
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
        walletId: ''
      }
      const exchangeDenom = denominations.find(denom => denom.name === currencyCode) as EdgeDenomination
      const displayDenom = displayDenominations[pluginId]?.[currencyCode] ?? exchangeDenom

      const transactionFee = convertTransactionFeeToDisplayFee(
        currencyCode,
        receivingWallet.fiatCurrencyCode,
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
    await Airship.show(bridge => <InsufficientFeesModal bridge={bridge} coreError={error} navigation={navigation} wallet={wallet} />)
  })

  const handleSlidingComplete = useHandler(() => {
    const filteredSweepPrivateKeyList = sweepPrivateKeyList.filter(asset => typeof feeState.get(asset.key) === 'string')
    navigation.push('sweepPrivateKeyCompletion', { memoryWallet, receivingWallet, sweepPrivateKeyList: filteredSweepPrivateKeyList })
  })

  // Create getMaxSpendable/makeSpend promises for each selected asset. We'll group them by wallet first and then execute all of them while keeping
  // track of which makeSpends are successful so we can enable the slider. A single failure from any of a wallet's assets will cast them all as failures.
  useAsyncEffect(
    async () => {
      const sortedSweepPrivateKeyList: SweepPrivateKeyItem[] = []
      const mainnetItemIndex = sweepPrivateKeyList.findIndex(item => item.tokenId == null)
      for (const [i, item] of sweepPrivateKeyList.entries()) {
        if (i === mainnetItemIndex) {
          sortedSweepPrivateKeyList.push(item)
        } else {
          sortedSweepPrivateKeyList.unshift(item)
        }
      }

      let successCount = 0
      const walletPromises = []

      let feeTotal = '0'
      const bundlesFeeTotals: Map<string, AssetRowState> = new Map(sortedSweepPrivateKeyList.map(item => [item.key, '0']))

      const publicAddress = (await receivingWallet.getReceiveAddress({ tokenId: null })).publicAddress
      const assetPromises = sweepPrivateKeyList.map((asset, i) => {
        return async () => {
          const spendInfo: EdgeSpendInfo = {
            tokenId: asset.tokenId,
            spendTargets: [{ publicAddress }],
            networkFeeOption: 'standard'
          }

          try {
            const maxAmount = await memoryWallet.getMaxSpendable(spendInfo)
            if (maxAmount === '0') {
              throw new InsufficientFundsError({ tokenId: asset.tokenId })
            }
            const maxSpendInfo = { ...spendInfo, spendTargets: [{ publicAddress, nativeAmount: maxAmount }] }
            const edgeTransaction = await memoryWallet.makeSpend(maxSpendInfo)
            const txFee = edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
            bundlesFeeTotals.set(asset.key, txFee)
            feeTotal = add(feeTotal, txFee)
            // While imperfect, sanity check that the total fee spent so far to send tokens + fee to send mainnet currency is under the total mainnet balance
            if (i === sortedSweepPrivateKeyList.length - 1 && lt(memoryWallet.balanceMap.get(null) ?? '0', feeTotal)) {
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

      await Promise.all(walletPromises.map(async promise => await promise()))

      if (mounted.current && successCount > 0) {
        setSliderDisabled(false)
      }

      return () => {
        mounted.current = false
      }
    },
    [],
    'SweepPrivateKeyCalculateFeeComponent'
  )

  const keyExtractor = useHandler((item: SweepPrivateKeyItem) => item.key)

  return (
    <SceneWrapper>
      <View style={styles.content}>
        <SceneHeader title={lstrings.sweep_private_key_calculate_fee_title} withTopMargin />
        <EdgeText style={styles.instructionalText} numberOfLines={4}>
          {lstrings.sweep_private_key_instructions_fragment}
        </EdgeText>
        <FlatList
          automaticallyAdjustContentInsets={false}
          data={sweepPrivateKeyList}
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

export const SweepPrivateKeyCalculateFeeScene = React.memo(SweepPrivateKeyCalculateFeeComponent)
