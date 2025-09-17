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

export const DropDownInputButton: React.FC<DropDownInputButtonProps> = (
  props: DropDownInputButtonProps
) => {
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
  paddingLeft: theme.rem(1),
  paddingRight: theme.rem(0.5), // Keep the chevron closer to the right side so it looks balanced.
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.rem(0.5),
  minWidth: theme.rem(4),
  height: theme.rem(3.25),
  margin: theme.rem(0.5)
}))
