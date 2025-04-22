import { View } from 'react-native'

import { UndoInsetStyle } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'

interface Props {
  expand?: boolean
  undoTop?: boolean
  undoRight?: boolean
  undoBottom?: boolean
  undoLeft?: boolean
  undoInsetStyle?: UndoInsetStyle
}
export const SceneContainer = styled(View)<Props>(theme => ({ expand, undoTop, undoRight, undoBottom, undoLeft, undoInsetStyle }) => ({
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
