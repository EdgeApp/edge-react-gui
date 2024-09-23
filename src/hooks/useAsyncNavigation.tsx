import { NavigationProp as NavigationCoreProp, StackActionHelpers } from '@react-navigation/native'
import * as React from 'react'

import { AppParamList, NavigationBase } from '../types/routerTypes'

/**
 * Use this in place of NavigationProp/NavigationBase methods to prevent
 * multiple navigations from rapid tapping. Navigation calls are only executed
 * if there isn't already another one in flight
 */
export const useAsyncNavigation = <T extends keyof AppParamList>(
  navigation: NavigationBase | (NavigationCoreProp<AppParamList, T> & StackActionHelpers<AppParamList>)
): NavigationBase & (NavigationCoreProp<AppParamList, T> & StackActionHelpers<AppParamList>) => {
  const [isNavigating, setIsNavigating] = React.useState(false)

  React.useEffect(() => {
    const handleNavComplete = () => {
      setIsNavigating(false)
    }

    const unsubscribeState = navigation.addListener('state', handleNavComplete)
    const unsubscribeFocus = navigation.addListener('focus', handleNavComplete)

    return () => {
      unsubscribeState()
      unsubscribeFocus()
    }
  }, [navigation])

  const createDebouncedMethod = <U extends (...args: Parameters<U>) => void>(method: U): U => {
    return ((...args: Parameters<U>) => {
      if (isNavigating) return

      setIsNavigating(true)
      method(...args)
    }) as U
  }

  return {
    ...navigation,
    push: createDebouncedMethod(navigation.push),
    navigate: createDebouncedMethod(navigation.navigate)
    // Add other navigation methods as needed
  }
}
