import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Platform, View } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { useTheme } from '../../components/services/ThemeContext'
import { triggerHaptic } from '../../util/haptic'
import { NavigationButton } from './NavigationButton'

const isIos = Platform.OS === 'ios'

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
  const backButton = isIos ? (
    <NavigationButton paddingRem={[0, 0.5]} onPress={handlePress}>
      <IonIcon color={theme.icon} name="chevron-back-outline" size={theme.rem(1.5)} />
    </NavigationButton>
  ) : (
    <NavigationButton paddingRem={[0, 0.75]} onPress={handlePress}>
      <IonIcon color={theme.icon} name="md-arrow-back" size={theme.rem(1.25)} />
    </NavigationButton>
  )

  return (
    <View testID="BackButton" accessible>
      {backButton}
    </View>
  )
}
