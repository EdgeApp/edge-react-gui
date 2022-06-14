// @flow

import { useEffect, useRef } from '../../types/reactHooks.js'
import { useWyrePromoFlags } from './useWyrePromoFlags.js'

/*
  To add more promo flags, follow the exact pattern used by 'wyrePromoFlags'
*/
export const usePromoFlags = () => {
  const promoFlags = useRef<{ [key: string]: boolean }>({})

  // Get the wyre promo flags using a hook or a syncronous method
  const wyrePromoFlags = useWyrePromoFlags()

  useEffect(() => {
    // If the 'wyrePromoFlags' flags has not been set yet, don't do anything
    if (wyrePromoFlags == null) return

    promoFlags.current = {
      ...promoFlags.current,

      // Destruct the wyre promo flags into a flat object
      ...wyrePromoFlags
    }
  }, [wyrePromoFlags])

  return promoFlags.current
}
