import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanBorrowMoreScene'>
  route: RouteProp<'loanBorrowMoreScene'>
}

export const LoanBorrowMoreScene = (props: Props) => {
  // @ts-expect-error
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  const debts = useWatch(borrowEngine, 'debts')

  return ManageCollateralScene({
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
