// @flow

import s from '../../../locales/strings.js'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'loanWithdrawCollateralScene'>,
  route: RouteProp<'loanWithdrawCollateralScene'>
}

export const LoanWithdrawCollateralScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params

  return ManageCollateralScene({
    // $FlowFixMe - Get ride of this hasty abstraction
    action: async req => await borrowEngine.withdraw(req),
    actionOpType: 'loan-withdraw',
    actionWallet: 'toWallet',
    amountChange: 'decrease',
    borrowEngine,
    borrowPluginId: borrowPlugin.borrowInfo.borrowPluginId,
    defaultTokenId: borrowEngine.collaterals[0].tokenId,
    ltvType: 'collaterals',

    showExchangeRateTile: true,
    showTotalDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_withdraw_collateral,
    navigation
  })
}
