import { HeaderTitleProps } from '@react-navigation/elements'
import * as React from 'react'

import { EdgeLogoHeader } from './EdgeLogoHeader'
import { HeaderTitle } from './HeaderTitle'

export function EdgeHeader(props: HeaderTitleProps) {
  const { children } = props

  if (typeof children === 'string' && children !== '') return <HeaderTitle title={children} />

  return <EdgeLogoHeader />
}
