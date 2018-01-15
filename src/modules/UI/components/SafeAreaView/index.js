// @flow
import React from 'react'
import { SafeAreaView } from 'react-native'
import Gradient from '../../components/Gradient/Gradient.ui'

type children = any

// The Gradient Component is a hack to make the upper portion of the safe area view have the edge gradient
const SafeAreaViewComponent = ({ children }: children) => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      {children}
      <Gradient style={{
        position: 'absolute',
        top: 0,
        right: 0,
        left: 0,
        height: 100,
        zIndex: -1000
      }}/>
  </SafeAreaView>
  )
}

export default SafeAreaViewComponent
