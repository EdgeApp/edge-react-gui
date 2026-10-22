import type { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'

import { useWatch } from '../../hooks/useWatch'
import { useSelector } from '../../types/reactRedux'
import { LoadingScene } from '../scenes/LoadingScene'

interface NavigationProps {
  navigation: { goBack: () => void }
  route: { params: { walletId: string } }
}

type WithoutWallet<Props> = Omit<Props, 'wallet'>

/**
 * Looks up a wallet for a scene.
 * If the wallet is missing, replaces the scene with a spinner instead.
 */
export function withWallet<Props extends { wallet: EdgeCurrencyWallet }>(
  Component: React.ComponentType<Props>
): React.FunctionComponent<WithoutWallet<Props> & NavigationProps> {
  return (props: WithoutWallet<Props> & NavigationProps) => {
    const { navigation, route } = props

    const account = useSelector(state => state.core.account)
    const currencyWallets = useWatch(account, 'currencyWallets')
    const wallet = currencyWallets[route.params.walletId]

    // Opening a wallet-scoped scene is the "the user wants this wallet"
    // signal: waitForCurrencyWallet moves the wallet's engine startup to
    // the front of the core's post-login queue. Rejections (a deleted or
    // broken wallet) are already handled by the effect below:
    const { walletId } = route.params
    React.useEffect(() => {
      if (account.waitForCurrencyWallet == null) return
      account.waitForCurrencyWallet(walletId).catch(() => {})
    }, [account, walletId])

    React.useEffect(() => {
      if (wallet == null) navigation.goBack()
    }, [navigation, wallet])

    if (wallet == null) return <LoadingScene />
    return <Component {...(props as any)} wallet={wallet} />
  }
}
