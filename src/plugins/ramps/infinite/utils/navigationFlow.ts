import type { NavigationBase } from '../../../../types/routerTypes'

export interface NavigationFlow {
  navigate: NavigationBase['navigate']
  goBack: () => void
}

export const makeNavigationFlow = (
  navigation: NavigationBase
): NavigationFlow => {
  let hasNavigated = false

  const navigate: NavigationBase['navigate'] = (
    ...args: Parameters<NavigationBase['navigate']>
  ): void => {
    if (hasNavigated) {
      navigation.replace(...(args as any))
    } else {
      navigation.navigate(...args)
      hasNavigated = true
    }
  }

  const goBack = (): void => {
    navigation.goBack()
    hasNavigated = false
  }

  return { navigate, goBack }
}
