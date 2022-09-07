// @flow

import s from '../../../locales/strings.js'
import { useSelector } from '../../../types/reactRedux'
import { type NavigationProp, type RouteProp } from '../../../types/routerTypes.js'
import { ManageCollateralScene } from './ManageCollateralScene.js'

type Props = {
  navigation: NavigationProp<'loanAddCollateralScene'>,
  route: RouteProp<'loanAddCollateralScene'>
}

export const LoanAddCollateralScene = (props: Props) => {
  const loanAccounts = useSelector(state => state.loanManager.loanAccounts)

  const { navigation, route } = props
  const { loanAccountId } = route.params
  const loanAccount = loanAccounts[loanAccountId]
  const { borrowEngine } = loanAccount

  return ManageCollateralScene({
    // $FlowFixMe - Get rid of this hasty abstraction
    action: async req => await borrowEngine.deposit(req),
    actionOperand: 'collaterals',
    actionOpType: 'loan-deposit',
    actionWallet: 'fromWallet',
    amountChange: 'increase',
    loanAccount,

    showExchangeRateTile: true,
    showTotalDebtTile: true,
    showTotalCollateralTile: true,

    headerText: s.strings.loan_add_collateral,
    navigation: navigation
  })
}
