import { EdgeMemoryWallet, EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { useWatch } from '../../hooks/useWatch'
import { lstrings } from '../../locales/strings'
import { useSelector } from '../../types/reactRedux'
import { EdgeSceneProps } from '../../types/routerTypes'
import { zeroString } from '../../util/utils'
import { showError } from '../services/AirshipInstance'
import { CancellableProcessingScene } from './CancellableProcessingScene'

export interface SweepPrivateKeyProcessingParams {
  memoryWalletPromise: Promise<EdgeMemoryWallet>
  receivingWalletId: string
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
  const { memoryWalletPromise, receivingWalletId } = route.params

  const account = useSelector(state => state.core.account)
  const currencyWallets = useWatch(account, 'currencyWallets')
  const receivingWallet = currencyWallets[receivingWalletId]

  const { displayName, pluginId } = receivingWallet.currencyInfo
  const { allTokens } = receivingWallet.currencyConfig

  const promise = async (): Promise<EdgeMemoryWallet> => {
    const memoryWallet = await memoryWalletPromise
    await memoryWallet.startEngine({ lightMode: true })

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
    navigation.goBack()
  }

  const onDone = (memoryWallet: EdgeMemoryWallet) => {
    const sweepPrivateKeyList: SweepPrivateKeyItem[] = [{ key: 'null', displayName: displayName, pluginId, tokenId: null }]
    for (const [tokenId, bal] of memoryWallet.balanceMap.entries()) {
      if (zeroString(bal) || tokenId == null) continue
      sweepPrivateKeyList.push({ key: tokenId, displayName: allTokens[tokenId].displayName, pluginId, tokenId })
    }

    if (sweepPrivateKeyList.length > 1) {
      navigation.replace('sweepPrivateKeySelectCrypto', { memoryWallet, receivingWalletId, sweepPrivateKeyList })
    } else {
      navigation.replace('sweepPrivateKeyCalculateFee', { memoryWallet, receivingWalletId, sweepPrivateKeyList })
    }
  }

  const onError = async (error: unknown): Promise<void> => {
    showError(error)
  }

  return (
    <CancellableProcessingScene
      animationDuration={1000}
      navigation={navigation}
      promise={promise}
      onCancel={onCancel}
      onDone={onDone}
      onError={onError}
      processingText={lstrings.sweep_private_key_syncing_balances}
    />
  )
}
