import * as React from 'react'
import { View } from 'react-native'

import { UndoInsetStyle } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'
import { SceneHeaderUi4 } from '../themed/SceneHeaderUi4'

interface Props extends SceneContainerViewProps {
  /**
   * The `title` prop for the {@link SceneHeaderUi4} component.
   */
  headerTitle?: string
  headerTitleChildren?: React.ReactNode
  children?: React.ReactNode
}

export function SceneContainer(props: Props) {
  const { children, headerTitle, headerTitleChildren, ...sceneContainerProps } = props

  return (
    <SceneContainerView {...sceneContainerProps}>
      {headerTitle != null ? <SceneHeaderUi4 title={headerTitle}>{headerTitleChildren}</SceneHeaderUi4> : null}
      {children}
    </SceneContainerView>
  )
}

interface SceneContainerViewProps {
  expand?: boolean
  undoTop?: boolean
  undoRight?: boolean
  undoBottom?: boolean
  undoLeft?: boolean
  undoInsetStyle?: UndoInsetStyle
}
const SceneContainerView = styled(View)<Props>(theme => ({ expand, undoTop, undoRight, undoBottom, undoLeft, undoInsetStyle }) => ({
  flex: expand === true ? 1 : undefined,
  paddingTop: theme.rem(0.5),
  paddingRight: theme.rem(0.5),
  paddingBottom: theme.rem(0.5),
  paddingLeft: theme.rem(0.5),
  marginTop: undoTop ? undoInsetStyle?.marginTop : undefined,
  marginRight: undoRight ? undoInsetStyle?.marginRight : undefined,
  marginBottom: undoBottom ? undoInsetStyle?.marginBottom : undefined,
  marginLeft: undoLeft ? undoInsetStyle?.marginLeft : undefined
}))
