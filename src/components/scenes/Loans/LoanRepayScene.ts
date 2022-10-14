import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanRepay'>
  route: RouteProp<'loanRepay'>
}

export const LoanMakeLoanPaymentScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]

  return ManageCollateralScene({
    actionOpType: 'loan-repay',
    amountChange: 'decrease',
    loanAccount,

    showAprChange: true,

    headerText: s.strings.loan_make_payment,
    navigation
  })
}
