import { releaseLinkPromo } from '../actions/DeepLinkingActions'
import { useDispatch } from '../types/reactRedux'
import type { LinkPromoTab } from '../types/types'
import type { TabBlurNavigation } from './useTabBlur'
import { useTabBlur } from './useTabBlur'

/**
 * Give up the promo attribution a deep link or promo card set when the user
 * leaves `tab` without converting.
 *
 * A link promo credits one entry into a buy, sell or swap flow. Without this
 * the only thing that ends the entry is a conversion, so a user who backs out
 * of the quote keeps the promo for the rest of the login session and the next
 * conversion they reach by any route is billed to the campaign.
 *
 * The listener sits on the TAB, not the scene, so stepping forward inside the
 * flow keeps the attribution: a provider's webview or bank form (registered
 * inside these stacks), and the `send2` deposit step a sell pushes above the
 * tabs, whose `Sell_Success` is only logged once the send completes. Only
 * switching tabs ends the entry.
 */
export function useLinkPromoRelease(
  navigation: TabBlurNavigation,
  tab: LinkPromoTab
): void {
  const dispatch = useDispatch()

  useTabBlur(navigation, tab, () => {
    dispatch(releaseLinkPromo(tab))
  })
}
