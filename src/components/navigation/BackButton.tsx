import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useTheme } from '../../components/services/ThemeContext'
import { triggerHaptic } from '../../util/haptic'
import { NavigationButton } from './NavigationButton'

export interface Props {
  onPress?: () => void
}

export const BackButton = (props: Props) => {
  const { onPress } = props
  const navigation = useNavigation()
  const theme = useTheme()

  const handlePress = () => {
    triggerHaptic('impactLight')
    if (onPress != null) {
      onPress()
    } else {
      navigation.goBack()
    }
  }

  return (
    <NavigationButton paddingRem={[0, 0.75]} onPress={handlePress}>
      <IonIcon testID="chevronBack" color={theme.icon} name="arrow-back" size={theme.rem(1.25)} />
    </NavigationButton>
  )
}
