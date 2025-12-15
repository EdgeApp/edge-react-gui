import * as React from 'react'
import { View } from 'react-native'

import type { UndoInsetStyle } from '../common/SceneWrapper'
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

export const SceneContainer: React.FC<Props> = (props: Props) => {
  const { children, headerTitle, headerTitleChildren, ...sceneContainerProps } =
    props

  return (
    <SceneContainerView {...sceneContainerProps}>
      {headerTitle != null ? (
        <SceneHeaderUi4 title={headerTitle}>
          {headerTitleChildren}
        </SceneHeaderUi4>
      ) : null}
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
const SceneContainerView = styled(View)<Props>(
  theme =>
    ({ expand, undoTop, undoRight, undoBottom, undoLeft, undoInsetStyle }) => ({
      flex: expand === true ? 1 : undefined,
      padding: undoInsetStyle == null ? theme.rem(0.5) : undefined,
      marginTop: undoTop === true ? undoInsetStyle?.marginTop : undefined,
      marginRight: undoRight === true ? undoInsetStyle?.marginRight : undefined,
      marginBottom:
        undoBottom === true ? undoInsetStyle?.marginBottom : undefined,
      marginLeft: undoLeft === true ? undoInsetStyle?.marginLeft : undefined
    })
)
