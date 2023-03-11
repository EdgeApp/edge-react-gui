import * as React from 'react'

import { LoanAccount } from '../../controllers/loan-manager/types'
import { useSelector } from '../../types/reactRedux'
import { AppParamList, NavigationProp } from '../../types/routerTypes'
import { LoadingScene } from '../scenes/LoadingScene'

interface NavigationProps {
  navigation: NavigationProp<keyof AppParamList>
  route: { params: { loanAccountId: string } }
}

type WithoutLoanAccount<Props> = Omit<Props, 'loanAccount'>

/**
 * Looks up a loanAccount for a scene.
 * If the loanAccount is missing, redirect back to the top of the scene stack.
 */
export function withLoanAccount<Props extends { loanAccount: LoanAccount }>(
  Component: React.ComponentType<Props>
): React.FunctionComponent<WithoutLoanAccount<Props> & NavigationProps> {
  return (props: WithoutLoanAccount<Props> & NavigationProps) => {
    const { navigation, route } = props

    const loanAccounts = useSelector(state => state.loanManager.loanAccounts)
    const loanAccount = loanAccounts[route.params.loanAccountId]

    React.useEffect(() => {
      if (loanAccount == null) navigation.navigate('loanDashboard', {})
    }, [navigation, loanAccount, loanAccounts])

    if (loanAccount == null) {
      // Prevent the wrapped scene from being called with a null LoanAccount.
      // useEffect will instantly navigate back to the dashboard in this case.
      return <LoadingScene />
    } else {
      return <Component {...(props as any)} loanAccount={loanAccount} />
    }
  }
}
