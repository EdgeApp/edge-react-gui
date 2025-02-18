import { useRoute } from '@react-navigation/native'
import * as React from 'react'

import { AppParamList, RouteProp } from '../../types/routerTypes'
import { HeaderTitle } from './HeaderTitle'

interface Props<RouteName extends keyof AppParamList, Params = RouteProp<RouteName>['params']> {
  fromParams: (params: Params) => string
}

export function ParamHeaderTitle<RouteName extends keyof AppParamList>(props: Props<RouteName>) {
  const route = useRoute<RouteProp<RouteName>>()
  const title = props.fromParams(route.params)
  return <HeaderTitle title={title} />
}
