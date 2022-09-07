// @flow

import s from '../../../locales/strings.js'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'loanRepayScene'>,
  route: RouteProp<'loanRepayScene'>
}

export const LoanMakeLoanPaymentScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  return ManageCollateralScene({
    // $FlowFixMe - Get rid of this hasty abstraction
    action: async req => await borrowEngine.repay(req),
    actionOpType: 'loan-repay',
    actionWallet: 'fromWallet',
    amountChange: 'decrease',
    loanAccount,
    ltvType: 'debts',

    showTotalDebtTile: true,
    showNewDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_make_payment,
    navigation
  })
}
