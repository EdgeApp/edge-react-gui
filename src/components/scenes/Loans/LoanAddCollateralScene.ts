import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanDeposit'>
  route: RouteProp<'loanDeposit'>
}

export const LoanAddCollateralScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]

  return ManageCollateralScene({
    actionOpType: 'loan-deposit',
    amountChange: 'increase',
    loanAccount,

    headerText: s.strings.loan_add_collateral,
    navigation: navigation
  })
}
