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
  const { borrowEngine } = route.params

  return ManageCollateralScene({
    borrowEngine,
    defaultTokenId: borrowEngine.debts[0].tokenId,
    action: async req => await borrowEngine.repay(req),
    actionWallet: 'fromWallet',
    ltvType: 'debts',
    ltvChange: 'decrease',

    showTotalDebtTile: true,
    showNewDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_make_payment,
    goBack: () => navigation.pop()
  })
}
