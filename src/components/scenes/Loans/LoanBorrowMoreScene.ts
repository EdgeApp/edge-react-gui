import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanBorrow'>
  route: RouteProp<'loanBorrow'>
}

export const LoanBorrowMoreScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]

  return ManageCollateralScene({
    actionOpType: 'loan-borrow',
    loanAccount,

    navigation
  })
}
