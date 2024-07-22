import { EdgeCurrencyWallet, EdgeMemoryWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import { EdgeSceneProps } from '../../types/routerTypes'
import { zeroString } from '../../util/utils'
import { CancellableProcessingScene } from '../progress-indicators/CancellableProcessingScene'
import { showError } from '../services/AirshipInstance'

export interface SweepPrivateKeyProcessingParams {
  memoryWalletPromise: Promise<EdgeMemoryWallet>
  receivingWallet: EdgeCurrencyWallet
}

export interface SweepPrivateKeyItem {
  key: string

  displayName: string
  pluginId: string
  tokenId: EdgeTokenId
}

interface Props extends EdgeSceneProps<'sweepPrivateKeyProcessing'> {}

export function SweepPrivateKeyProcessingScene(props: Props) {
  const { route, navigation } = props
  const { memoryWalletPromise, receivingWallet } = route.params

  const { displayName, pluginId } = receivingWallet.currencyInfo
  const { allTokens } = receivingWallet.currencyConfig

  const promise = async (): Promise<EdgeMemoryWallet> => {
    const memoryWallet = await memoryWalletPromise
    await memoryWallet.startEngine()

    let syncRatioResolver: (value: unknown) => void
    const syncRatioPromise = new Promise((resolve, reject) => {
      syncRatioResolver = resolve
    })

    const syncRatioWatcher = (syncRatio: number) => {
      if (syncRatio >= 1) {
        syncRatioResolver(syncRatio)
      }
    }

    const detectedTokenIdsWatcher = async (tokenIds: string[]) => {
      await memoryWallet.changeEnabledTokenIds(tokenIds)
    }

    memoryWallet.watch('syncRatio', syncRatioWatcher)
    memoryWallet.watch('detectedTokenIds', detectedTokenIdsWatcher)

    await syncRatioPromise
    return memoryWallet
  }

  const onCancel = () => {
    memoryWalletPromise.then(async memoryWallet => await memoryWallet.close()).catch(() => {})
    navigation.goBack()
  }

  const onDone = (memoryWallet: EdgeMemoryWallet) => {
    const sweepPrivateKeyList: SweepPrivateKeyItem[] = [{ key: 'null', displayName: displayName, pluginId, tokenId: null }]
    for (const [tokenId, bal] of memoryWallet.balanceMap.entries()) {
      if (zeroString(bal) || tokenId == null) continue
      sweepPrivateKeyList.unshift({ key: tokenId, displayName: allTokens[tokenId].displayName, pluginId, tokenId })
    }

    if (sweepPrivateKeyList.length > 1) {
      navigation.replace('sweepPrivateKeySelectCrypto', { memoryWallet, receivingWallet, sweepPrivateKeyList })
    } else {
      navigation.replace('sweepPrivateKeyCalculateFee', { memoryWallet, receivingWallet, sweepPrivateKeyList })
    }
  }

  const onError = async (error: unknown): Promise<void> => {
    showError(error)
  }

  return (
    <CancellableProcessingScene
      animationDuration={1000}
      navigation={navigation}
      doWork={promise}
      onCancel={onCancel}
      onDone={onDone}
      onError={onError}
      processingText={lstrings.sweep_private_key_syncing_balances}
    />
  )
}
