import * as React from 'react'

import { LoanAccount } from '../../controllers/loan-manager/types'
import { useSelector } from '../../types/reactRedux'
import { LoadingScene } from '../scenes/LoadingScene'

interface NavigationProps {
  navigation: { popToTop: () => void }
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
      if (loanAccount == null) navigation.popToTop()
    }, [navigation, loanAccount, loanAccounts])

    if (loanAccount == null) return <LoadingScene />

    return <Component {...(props as any)} loanAccount={loanAccount} />
  }
}
