import { useWatch } from '../../../hooks/useWatch'
import s from '../../../locales/strings'
import { useSelector } from '../../../types/reactRedux'
import { NavigationProp, RouteProp } from '../../../types/routerTypes'
import { ManageCollateralScene } from './ManageCollateralScene'

type Props = {
  navigation: NavigationProp<'loanWithdrawCollateralScene'>
  route: RouteProp<'loanWithdrawCollateralScene'>
}

export const LoanWithdrawCollateralScene = (props: Props) => {
  // @ts-expect-error
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  const collaterals = useWatch(borrowEngine, 'collaterals')

  return ManageCollateralScene({
    action: async req => await borrowEngine.withdraw(req),
    actionOpType: 'loan-withdraw',
    actionWallet: 'toWallet',
    amountChange: 'decrease',
    defaultTokenId: collaterals[0].tokenId,
    loanAccount,
    ltvType: 'collaterals',

    showExchangeRateTile: true,
    showTotalDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_withdraw_collateral,
    navigation
  })
}
