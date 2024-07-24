import { add, lt, sub } from 'biggystring'
import {
  asMaybeInsufficientFundsError,
  EdgeCurrencyWallet,
  EdgeDenomination,
  EdgeMemoryWallet,
  EdgeSpendInfo,
  EdgeTransaction,
  InsufficientFundsError
} from 'edge-core-js'
import * as React from 'react'
import { ActivityIndicator, ListRenderItemInfo, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'

import { SCROLL_INDICATOR_INSET_FIX } from '../../constants/constantSettings'
import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
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
  receivingWallet: EdgeCurrencyWallet
  sweepPrivateKeyList: SweepPrivateKeyItem[]
}

interface Props extends EdgeSceneProps<'sweepPrivateKeyCalculateFee'> {}

const SweepPrivateKeyCalculateFeeComponent = (props: Props) => {
  const { navigation, route } = props
  const { memoryWallet, receivingWallet, sweepPrivateKeyList } = route.params

  const theme = useTheme()
  const styles = getStyles(theme)

  const exchangeRates = useSelector(state => state.exchangeRates)
  const displayDenominations = useSelector(state => {
    const { denominationSettings = {} } = state.ui.settings
    return denominationSettings
  })

  const mounted = React.useRef<boolean>(true)

  const [transactionState, setTransactionState] = React.useState<Map<string, EdgeTransaction | Error>>(new Map())
  const [sliderDisabled, setSliderDisabled] = React.useState(true)

  const renderCurrencyRow = useHandler((data: ListRenderItemInfo<SweepPrivateKeyItem>) => {
    const { key, pluginId, tokenId } = data.item

    if (receivingWallet == null) return null
    const {
      currencyInfo: { currencyCode, denominations }
    } = receivingWallet
    const walletName = ''
    const tx = transactionState.get(key)

    let rightSide: JSX.Element
    if (tx == null) {
      rightSide = <ActivityIndicator style={{ paddingRight: theme.rem(0.3125) }} color={theme.iconTappable} />
    } else if (tx instanceof Error) {
      rightSide = <EdgeText style={{ color: theme.negativeText, fontSize: theme.rem(0.75) }}>{tx.message}</EdgeText>

      if (tx instanceof InsufficientFundsError) {
        return (
          <CreateWalletSelectCryptoRow
            pluginId={pluginId}
            tokenId={tokenId}
            walletName=""
            rightSide={rightSide}
            onPress={async () => {
              await handleInsufficientFunds(receivingWallet, tx)
            }}
          />
        )
      }
    } else {
      const exchangeDenom = denominations.find(denom => denom.name === currencyCode) as EdgeDenomination
      const displayDenom = displayDenominations[pluginId]?.[currencyCode] ?? exchangeDenom

      const transactionFee = convertTransactionFeeToDisplayFee(currencyCode, receivingWallet.fiatCurrencyCode, exchangeRates, tx, displayDenom, exchangeDenom)
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
    const unsignedEdgeTransactions: EdgeTransaction[] = []
    for (const item of sweepPrivateKeyList) {
      const tx = transactionState.get(item.key)
      if (tx == null || tx instanceof Error) continue
      unsignedEdgeTransactions.push(tx)
    }
    navigation.push('sweepPrivateKeyCompletion', { memoryWallet, receivingWallet, unsignedEdgeTransactions })
  })

  // Create getMaxSpendable/makeSpend promises for each selected asset. We'll group them by wallet first and then execute all of them while keeping
  // track of which makeSpends are successful so we can enable the slider. A single failure from any of a wallet's assets will cast them all as failures.
  useAsyncEffect(
    async () => {
      let feeTotal = '0'

      const tokenItems = [...sweepPrivateKeyList]
      const mainnetItem = tokenItems.splice(sweepPrivateKeyList.length - 1, 1)[0]
      const publicAddress = (await receivingWallet.getReceiveAddress({ tokenId: null })).publicAddress

      const getMax = async (asset: SweepPrivateKeyItem, numPendingTxs: number) => {
        const fakeEdgeTransaction: EdgeTransaction = {
          blockHeight: 0,
          currencyCode: '',
          date: 0,
          memos: [],
          isSend: true,
          nativeAmount: '0',
          networkFee: '0',
          ourReceiveAddresses: [],
          signedTx: '',
          tokenId: null,
          txid: '',
          walletId: ''
        }

        const spendInfo: EdgeSpendInfo = {
          tokenId: asset.tokenId,
          spendTargets: [{ publicAddress }],
          networkFeeOption: 'standard',
          pendingTxs: Array.from({ length: numPendingTxs }, () => fakeEdgeTransaction)
        }

        try {
          const maxAmount = await memoryWallet.getMaxSpendable(spendInfo)
          if (maxAmount === '0') {
            throw new InsufficientFundsError({ tokenId: asset.tokenId })
          }
          let nativeAmount = maxAmount
          if (asset.tokenId === null) {
            nativeAmount = sub(nativeAmount, feeTotal)
          }
          const maxSpendInfo = { ...spendInfo, spendTargets: [{ publicAddress, nativeAmount }] }
          const edgeTransaction = await memoryWallet.makeSpend(maxSpendInfo)
          const txFee = edgeTransaction.parentNetworkFee ?? edgeTransaction.networkFee
          setTransactionState(prevState => new Map([...prevState, [asset.key, edgeTransaction]]))
          feeTotal = add(feeTotal, txFee)
          // While imperfect, sanity check that the total fee spent so far to send tokens + fee to send mainnet currency is under the total mainnet balance
          if (lt(memoryWallet.balanceMap.get(null) ?? '0', feeTotal)) {
            throw new InsufficientFundsError({ tokenId: null, networkFee: feeTotal })
          }
        } catch (e) {
          const insufficientFundsError = asMaybeInsufficientFundsError(e)
          if (insufficientFundsError != null) {
            setTransactionState(prevState => new Map([...prevState, [asset.key, insufficientFundsError]]))
          } else {
            setTransactionState(prevState => new Map([...prevState, [asset.key, Error(lstrings.migrate_unknown_error_fragment)]]))
          }
        }
      }

      await Promise.all(tokenItems.map(async (item, index) => await getMax(item, index)))
      await getMax(mainnetItem, tokenItems.length)

      if (mounted.current) {
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
          extraData={transactionState}
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
