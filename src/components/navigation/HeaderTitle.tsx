import * as React from 'react'

import { EdgeText } from '../themed/EdgeText'

interface Props {
  title?: string
}

export const HeaderTitle = (props: Props) => {
  const { title } = props

  return <EdgeText>{title}</EdgeText>
}
