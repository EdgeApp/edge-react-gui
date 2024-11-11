import { NavigationProp } from '@react-navigation/native'
import * as React from 'react'

/**
 * Use this in place of navigation methods to prevent
 * multiple navigations from rapid tapping. Navigation calls are only executed
 * if there isn't already another one in flight
 */
export const useAsyncNavigation = <Nav extends NavigationProp<any>>(navigation: Nav): Nav => {
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

  const createDebouncedMethod = <Method extends (...args: any[]) => any>(method: Method): Method => {
    return ((...args: Parameters<Method>) => {
      if (isNavigating) return

      setIsNavigating(true)
      return method(...args)
    }) as Method
  }

  const out: Nav = {
    ...navigation,
    navigate: createDebouncedMethod(navigation.navigate),
    // Wrap other methods if they exist
    ...(Object.prototype.hasOwnProperty.call(navigation, 'push') && {
      push: createDebouncedMethod((navigation as any).push)
    }),
    ...(Object.prototype.hasOwnProperty.call(navigation, 'replace') && {
      replace: createDebouncedMethod((navigation as any).replace)
    }),
    ...(Object.prototype.hasOwnProperty.call(navigation, 'goBack') && {
      goBack: createDebouncedMethod((navigation as any).goBack)
    })
    // Add other navigation methods as needed, checking if they exist
  }

  return out
}
