// @flow

import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings.js'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'loanBorrowMoreScene'>,
  route: RouteProp<'loanBorrowMoreScene'>
}

export const LoanBorrowMoreScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  const debts = useWatch(borrowEngine, 'debts')

  return ManageCollateralScene({
    // $FlowFixMe - Get rid of this hasty abstraction
    action: async req => await borrowEngine.borrow(req),
    actionOpType: 'loan-borrow',
    actionWallet: 'fromWallet',
    amountChange: 'increase',
    defaultTokenId: debts[0].tokenId,
    loanAccount,
    ltvType: 'debts',

    showTotalDebtTile: true,
    showNewDebtTile: true,
    showTotalCollateralTile: true,
    showNewDebtAprChange: true,

    headerText: s.strings.loan_borrow_more,
    navigation
  })
}
