import { useNavigation } from '@react-navigation/native'
import * as React from 'react'
import { Platform, TouchableOpacity } from 'react-native'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { cacheStyles, Theme, useTheme } from '../../components/services/ThemeContext'
import { triggerHaptic } from '../../util/haptic'

const isIos = Platform.OS === 'ios'

export interface Props {
  isEmpty?: boolean
  onPress?: () => void
}

export const BackButton = (props: Props) => {
  const { isEmpty = false, onPress } = props
  const navigation = useNavigation()
  const theme = useTheme()
  const styles = getBackButtonStyles(theme)

  const handlePress = () => {
    triggerHaptic('impactLight')
    if (onPress != null) {
      onPress()
    } else {
      navigation.goBack()
    }
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      {isEmpty ? null : <Icon />}
    </TouchableOpacity>
  )
}

const getBackButtonStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.rem(1),
    height: 44 // This is a fixed height of the navigation header no matter what screen size. Default by router-flux
  }
}))

const Icon = () => {
  const theme = useTheme()
  const styles = getIconStyles(theme)

  return isIos ? (
    <IonIcon size={theme.rem(1.5)} color={theme.icon} name="chevron-back-outline" style={styles.backIconStyle} />
  ) : (
    <IonIcon size={theme.rem(1.25)} color={theme.icon} name="md-arrow-back" style={styles.backIconAndroid} />
  )
}

const getIconStyles = cacheStyles((theme: Theme) => ({
  backIconStyle: {
    marginLeft: theme.rem(-0.25),
    marginBottom: theme.rem(0.25),
    paddingRight: theme.rem(0.75)
  },
  backIconAndroid: {
    paddingRight: theme.rem(1)
  }
}))
