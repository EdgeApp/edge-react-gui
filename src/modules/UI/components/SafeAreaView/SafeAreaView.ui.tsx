import * as React from 'react'
import { StyleSheet } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'

import { THEME } from '../../../../theme/variables/airbitz'
import { Gradient } from '../../components/Gradient/Gradient.ui'

type props = {
  // @ts-expect-error
  style?: StyleSheet.Styles
  children: React.ReactNode
}

// The Gradient Component is a hack to make the upper portion of the safe area view have the edge gradient
export const SafeAreaViewComponent = ({ style, children }: props) => {
  return (
    <SafeAreaView style={[style, { flex: 1 }]}>
      {children}
      <Gradient
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          height: THEME.HEADER,
          zIndex: -1000
        }}
      />
    </SafeAreaView>
  )
}
