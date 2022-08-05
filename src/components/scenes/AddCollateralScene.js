// @flow

import s from '../../locales/strings.js'
import { type NavigationProp, type RouteProp } from '../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'addCollateralScene'>,
  route: RouteProp<'addCollateralScene'>
}

export const AddCollateralScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine } = route.params

  return ManageCollateralScene({
    borrowEngine,
    defaultTokenId: borrowEngine.collaterals[0].tokenId,
    action: async req => await borrowEngine.deposit(req),
    actionWallet: 'fromWallet',
    ltvType: 'collaterals',
    ltvChange: 'decrease',

    showExchangeRateTile: true,
    showTotalDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_add_collateral,
    goBack: () => navigation.pop()
  })
}
