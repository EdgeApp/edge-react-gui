import type {
  EdgeCurrencyWallet,
  EdgeMemoryWallet,
  EdgeTokenId
} from 'edge-core-js'
import * as React from 'react'

import { lstrings } from '../../locales/strings'
import type { EdgeAppSceneProps } from '../../types/routerTypes'
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

interface Props extends EdgeAppSceneProps<'sweepPrivateKeyProcessing'> {}

export const SweepPrivateKeyProcessingScene: React.FC<Props> = props => {
  const { route, navigation } = props
  const { memoryWalletPromise, receivingWallet } = route.params

  const { displayName, pluginId } = receivingWallet.currencyInfo
  const { allTokens } = receivingWallet.currencyConfig

  const doWork = async (isCancelled: () => boolean): Promise<void> => {
    const memoryWallet = await memoryWalletPromise
    await memoryWallet.startEngine()

    let syncRatioResolver: (value: unknown) => void
    const syncRatioPromise = new Promise((resolve, reject) => {
      syncRatioResolver = resolve
    })

    const syncRatioWatcher = (syncRatio: number): void => {
      if (syncRatio >= 1) {
        syncRatioResolver(syncRatio)
      }
    }

    const detectedTokenIdsWatcher = async (
      tokenIds: string[]
    ): Promise<void> => {
      await memoryWallet.changeEnabledTokenIds(tokenIds)
    }

    memoryWallet.watch('syncRatio', syncRatioWatcher)
    memoryWallet.watch('detectedTokenIds', detectedTokenIdsWatcher)

    await syncRatioPromise

    const sweepPrivateKeyList: SweepPrivateKeyItem[] = [
      { key: 'null', displayName, pluginId, tokenId: null }
    ]
    for (const [tokenId, bal] of memoryWallet.balanceMap.entries()) {
      if (zeroString(bal) || tokenId == null) continue
      sweepPrivateKeyList.unshift({
        key: tokenId,
        displayName: allTokens[tokenId].displayName,
        pluginId,
        tokenId
      })
    }

    if (isCancelled()) return

    if (sweepPrivateKeyList.length > 1) {
      navigation.replace('sweepPrivateKeySelectCrypto', {
        memoryWallet,
        receivingWallet,
        sweepPrivateKeyList
      })
    } else {
      navigation.replace('sweepPrivateKeyCalculateFee', {
        memoryWallet,
        receivingWallet,
        sweepPrivateKeyList
      })
    }
  }

  const onCancel = (): void => {
    memoryWalletPromise
      .then(async (memoryWallet: EdgeMemoryWallet) => {
        await memoryWallet.close()
      })
      .catch(() => {})
    navigation.goBack()
  }

  const onError = async (error: unknown): Promise<void> => {
    showError(error)
  }

  return (
    <CancellableProcessingScene
      animationDuration={1000}
      doWork={doWork}
      onCancel={onCancel}
      onError={onError}
      processingText={lstrings.sweep_private_key_syncing_balances}
    />
  )
}
