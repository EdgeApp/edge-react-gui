import * as React from 'react'

import { releaseLinkPromo } from '../actions/DeepLinkingActions'
import { useDispatch } from '../types/reactRedux'
import type { LinkPromoTab } from '../types/types'

/**
 * The slice of a scene's navigation prop this hook needs: the parent tab
 * navigator, and its blur event. Declared structurally so each scene passes
 * its own route-typed `navigation` straight through, rather than casting to
 * the deprecated flat navigation type.
 */
interface TabBlurNavigation {
  getParent: () =>
    | { addListener: (event: 'blur', callback: () => void) => () => void }
    | undefined
}

/**
 * Give up the promo attribution a deep link or promo card set when the user
 * leaves `tab` without converting.
 *
 * A link promo credits one entry into a buy, sell or swap flow. Without this
 * the only thing that ends the entry is a conversion, so a user who backs out
 * of the quote keeps the promo for the rest of the login session and the next
 * conversion they reach by any route is billed to the campaign.
 *
 * The listener sits on the TAB, not the scene, so stepping forward to a
 * provider's webview or a bank form (both registered inside these stacks)
 * keeps the attribution. Only leaving the tab ends the entry.
 */
export function useLinkPromoRelease(
  navigation: TabBlurNavigation,
  tab: LinkPromoTab
): void {
  const dispatch = useDispatch()

  React.useEffect(() => {
    const tabNavigation = navigation.getParent()
    if (tabNavigation == null) return
    return tabNavigation.addListener('blur', () => {
      dispatch(releaseLinkPromo(tab))
    })
  }, [dispatch, navigation, tab])
}
