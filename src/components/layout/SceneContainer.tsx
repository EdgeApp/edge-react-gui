import * as React from 'react'
import { View, ViewStyle } from 'react-native'

import { UndoInsetStyle } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'

interface SceneContainerProps {
  undoTop?: boolean
  undoRight?: boolean
  undoBottom?: boolean
  undoLeft?: boolean
  undoInsetStyle?: UndoInsetStyle
  center?: boolean
  children?: React.ReactNode
  title?: string
}

const centerStyle: ViewStyle = {
  flexGrow: 1,
  flexShrink: 0,
  alignItems: 'center',
  justifyContent: 'center'
}

export const SceneContainer = (props: SceneContainerProps) => {
  const { children, title } = props
  return (
    <>
      {title == null ? null : <SceneHeaderUi4 title={title} />}
      <SceneContainerView {...props}>{children}</SceneContainerView>
    </>
  )
}

export const SceneContainerView = styled(View)<SceneContainerProps>(theme => ({ undoTop, undoRight, undoBottom, undoLeft, undoInsetStyle, center }) => ({
  paddingTop: theme.rem(0.5),
  paddingRight: theme.rem(0.5),
  paddingBottom: theme.rem(0.5),
  paddingLeft: theme.rem(0.5),
  marginTop: undoTop ? undoInsetStyle?.marginTop : undefined,
  marginRight: undoRight ? undoInsetStyle?.marginRight : undefined,
  marginBottom: undoBottom ? undoInsetStyle?.marginBottom : undefined,
  marginLeft: undoLeft ? undoInsetStyle?.marginLeft : undefined,
  ...(center ? centerStyle : {})
}))
