import * as React from 'react'

import { useHandler } from './useHandler'

/**
 * The slice of a scene's navigation prop this hook needs: the parent tab
 * navigator, its blur event, and its own state. Declared structurally so each
 * scene passes its own route-typed `navigation` straight through, rather than
 * casting to the deprecated flat navigation type.
 */
export interface TabBlurNavigation {
  getParent: () =>
    | {
        addListener: (event: 'blur', callback: () => void) => () => void
        getState: () => { index: number; routes: Array<{ name: string }> }
      }
    | undefined
}

/**
 * Run `onLeave` when the user switches away from `tab`.
 *
 * React-navigation re-emits a navigator's blur to its focused child, so an
 * `AppStack` scene opening over the tabs blurs the tab as well, even though
 * the user is still inside the flow that scene belongs to: the ramp providers
 * push `send2` there for a sell's deposit. Only a tab switch moves the tab
 * navigator off `tab`, so a blur that leaves it focused came from above the
 * tabs and is filtered out here.
 */
export function useTabBlur(
  navigation: TabBlurNavigation,
  tab: string,
  onLeave: () => void
): void {
  const handleLeave = useHandler(onLeave)

  React.useEffect(() => {
    const tabNavigation = navigation.getParent()
    if (tabNavigation == null) return
    return tabNavigation.addListener('blur', () => {
      const { index, routes } = tabNavigation.getState()
      if (routes[index].name === tab) return

      handleLeave()
    })
  }, [handleLeave, navigation, tab])
}
