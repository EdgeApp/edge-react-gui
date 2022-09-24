import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanBorrowMoreScene'>
  route: RouteProp<'loanBorrowMoreScene'>
}

export const LoanBorrowMoreScene = (props: Props) => {
  const loanAccountMap = useSelector(state => state.loanManager.loanAccountMap)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccountMap[loanAccountId]
  const { borrowEngine } = loanAccount

  return ManageCollateralScene({
    action: async req => await borrowEngine.borrow(req),
    actionOperand: 'debts',
    actionOpType: 'loan-borrow',
    actionWallet: 'fromWallet',
    amountChange: 'increase',
    loanAccount,

    showAprChange: true,

    headerText: s.strings.loan_borrow_more,
    navigation
  })
}
