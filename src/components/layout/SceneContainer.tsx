import { View } from 'react-native'

import { UndoInsetStyle } from '../common/SceneWrapper'
import { styled } from '../hoc/styled'

interface Props {
  undoTop?: boolean
  undoRight?: boolean
  undoBottom?: boolean
  undoLeft?: boolean
  undoInsetStyle?: UndoInsetStyle
}
export const SceneContainer = styled(View)<Props>(theme => ({ undoTop, undoRight, undoBottom, undoLeft, undoInsetStyle }) => ({
  paddingTop: theme.rem(0.5),
  paddingRight: theme.rem(0.5),
  paddingBottom: theme.rem(0.5),
  paddingLeft: theme.rem(0.5),
  marginTop: undoTop ? undoInsetStyle?.marginTop : undefined,
  marginRight: undoRight ? undoInsetStyle?.marginRight : undefined,
  marginBottom: undoBottom ? undoInsetStyle?.marginBottom : undefined,
  marginLeft: undoLeft ? undoInsetStyle?.marginLeft : undefined
}))
