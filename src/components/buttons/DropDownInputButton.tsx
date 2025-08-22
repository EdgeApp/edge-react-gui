import * as React from 'react'
import Ionicon from 'react-native-vector-icons/Ionicons'

import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'

export interface DropDownInputButtonProps {
  children: React.ReactNode
  onPress: () => void | Promise<void>
  testID?: string
}

export const DropDownInputButton = (
  props: DropDownInputButtonProps
): React.ReactElement => {
  const { children, onPress, testID } = props
  const theme = useTheme()

  return (
    <Container onPress={onPress} testID={testID}>
      {children}
      <Ionicon
        name="chevron-down"
        size={theme.rem(1)}
        color={theme.iconTappable}
      />
    </Container>
  )
}

const Container = styled(EdgeTouchableOpacity)(theme => ({
  backgroundColor: theme.textInputBackgroundColor,
  borderRadius: theme.rem(0.5),
  padding: theme.rem(1),
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.rem(0.25),
  minWidth: theme.rem(4),
  height: theme.rem(3.25)
}))
