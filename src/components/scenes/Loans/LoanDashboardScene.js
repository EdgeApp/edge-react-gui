// @flow
import * as React from 'react'

import s from '../../../locales/strings'
import { type NavigationProp } from '../../../types/routerTypes'
import { SceneWrapper } from '../../common/SceneWrapper'
import { SceneHeader } from '../../themed/SceneHeader'

type Props = {
  navigation: NavigationProp<'loanDashboard'>
}

export const LoanDashboardScene = (props: Props) => {
  const { navigation } = props
  navigation.navigate('loanDetails')

  return (
    <SceneWrapper background="theme" hasTabs={false}>
      <SceneHeader underline title={s.strings.loan_dashboard_title} />
    </SceneWrapper>
  )
}
