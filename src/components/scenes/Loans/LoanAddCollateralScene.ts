import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanAddCollateralScene'>
  route: RouteProp<'loanAddCollateralScene'>
}

export const LoanAddCollateralScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  const collaterals = useWatch(borrowEngine, 'collaterals')

  return ManageCollateralScene({
    // @ts-expect-error - Get rid of this hasty abstraction
    action: async req => await borrowEngine.deposit(req),
    actionOpType: 'loan-deposit',
    actionWallet: 'fromWallet',
    amountChange: 'increase',
    defaultTokenId: collaterals[0].tokenId,
    loanAccount,
    ltvType: 'collaterals',

    showExchangeRateTile: true,
    showTotalDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_add_collateral,
    navigation: navigation
  })
}
