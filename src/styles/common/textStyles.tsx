import * as React from 'react'
import { Text } from 'react-native'

import { THEME } from '../../theme/variables/airbitz'

/**
 * Use this component just like its HTML equivalent.
 */
export function B(props: { children: React.ReactNode }) {
  return <Text style={{ fontFamily: THEME.FONTS.BOLD }}>{props.children}</Text>
}
