import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanAddCollateralScene'>
  route: RouteProp<'loanAddCollateralScene'>
}

export const LoanAddCollateralScene = (props: Props) => {
  const loanAccountMap = useSelector(state => state.loanManager.loanAccountMap)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccountMap[loanAccountId]
  const { borrowEngine } = loanAccount

  return ManageCollateralScene({
    action: async req => await borrowEngine.deposit(req),
    actionOperand: 'collaterals',
    actionOpType: 'loan-deposit',
    actionWallet: 'fromWallet',
    amountChange: 'increase',
    loanAccount,

    headerText: s.strings.loan_add_collateral,
    navigation: navigation
  })
}
