import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanRepayScene'>
  route: RouteProp<'loanRepayScene'>
}

export const LoanMakeLoanPaymentScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  return ManageCollateralScene({
    // @ts-expect-error - Get rid of this hasty abstraction
    action: async req => await borrowEngine.repay(req),
    actionOperand: 'debts',
    actionOpType: 'loan-repay',
    actionWallet: 'fromWallet',
    amountChange: 'decrease',
    loanAccount,

    showAprChange: true,

    headerText: s.strings.loan_make_payment,
    navigation
  })
}
