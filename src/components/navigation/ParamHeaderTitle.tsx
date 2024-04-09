import { useRoute } from '@react-navigation/native'
import { EdgeTokenId } from 'edge-core-js'
import * as React from 'react'

import { AppParamList, RouteProp } from '../../types/routerTypes'
import { CryptoHeaderTitle, HeaderTitle } from './HeaderTitle'

interface Props<RouteName extends keyof AppParamList, Params = RouteProp<RouteName>['params']> {
  fromParams: (params: Params) => string
}

export function ParamHeaderTitle<RouteName extends keyof AppParamList>(props: Props<RouteName>) {
  const route = useRoute<RouteProp<RouteName>>()
  const title = props.fromParams(route.params)
  return <HeaderTitle title={title} />
}

interface CryptoIconProps<RouteName extends keyof AppParamList, Params = RouteProp<RouteName>['params']> {
  fromCryptoIconParams: (params: Params) => { walletId: string; tokenId: EdgeTokenId }
}

export function ParamHeaderCryptoIconTitle<RouteName extends keyof AppParamList>(props: CryptoIconProps<RouteName>) {
  const route = useRoute<RouteProp<RouteName>>()
  const { walletId, tokenId } = props.fromCryptoIconParams(route.params)
  return <CryptoHeaderTitle walletId={walletId} tokenId={tokenId} />
}
