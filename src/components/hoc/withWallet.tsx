import { EdgeCurrencyWallet } from 'edge-core-js'
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

    React.useEffect(() => {
      if (wallet == null) navigation.goBack()
    }, [navigation, wallet])

    if (wallet == null) return <LoadingScene />
    return <Component {...(props as any)} wallet={wallet} />
  }
}
