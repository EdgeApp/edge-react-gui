import * as React from 'react'

import { UnscaledText } from '../../components/text/UnscaledText'
import { THEME } from '../../theme/variables/airbitz'

/**
 * Use this component just like its HTML equivalent.
 */
export const B: React.FC<{ children: React.ReactNode }> = props => {
  return (
    <UnscaledText style={{ fontFamily: THEME.FONTS.BOLD }}>
      {props.children}
    </UnscaledText>
  )
}
