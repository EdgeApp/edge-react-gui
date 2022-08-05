// @flow

import s from '../../../locales/strings.js'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'loanRepayScene'>,
  route: RouteProp<'loanRepayScene'>
}

export const LoanMakeLoanPaymentScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params

  return ManageCollateralScene({
    action: async req => await borrowEngine.repay(req),
    actionOpType: 'loan-repay',
    actionWallet: 'fromWallet',
    amountChange: 'decrease',
    borrowEngine,
    borrowPluginId: borrowPlugin.borrowInfo.pluginId,
    defaultTokenId: borrowEngine.debts[0].tokenId,
    ltvType: 'debts',

    showTotalDebtTile: true,
    showNewDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_make_payment,
    navigation
  })
}
