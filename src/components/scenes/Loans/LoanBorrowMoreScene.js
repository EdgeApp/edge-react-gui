// @flow

import s from '../../../locales/strings.js'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'loanBorrowMoreScene'>,
  route: RouteProp<'loanBorrowMoreScene'>
}

export const LoanBorrowMoreScene = (props: Props) => {
  const { navigation, route } = props
  const { borrowEngine, borrowPlugin } = route.params

  return ManageCollateralScene({
    action: async req => await borrowEngine.borrow(req),
    actionOpType: 'loan-borrow',
    actionWallet: 'fromWallet',
    amountChange: 'increase',
    borrowEngine,
    borrowPluginId: borrowPlugin.borrowInfo.pluginId,
    defaultTokenId: borrowEngine.debts[0].tokenId,
    ltvType: 'debts',

    showTotalDebtTile: true,
    showNewDebtTile: true,
    showTotalCollateralTile: true,
    showNewDebtAprChange: true,

    headerText: s.strings.loan_borrow_more,
    navigation
  })
}
