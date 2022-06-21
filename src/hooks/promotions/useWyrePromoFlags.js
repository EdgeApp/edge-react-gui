// @flow

import { asArray, asObject, asString } from 'cleaners'

import { useSelector } from '../../types/reactRedux.js'
import { useAsyncEffect } from '../useAsyncEffect.js'
import { useFetch } from '../useFetch.js'

const asWyrePaymentMethodResponse = asObject({
  data: asArray(
    asObject({
      status: asString
    })
  )
})

// Hook to get the current wyre promotion flags for the user
export const useWyrePromoFlags = () => {
  const store = useSelector(state => state.core.account.dataStore)

  const asWyrePromoFlags = data => ({
    hasWyrelinkedBank: asWyrePaymentMethodResponse(data).data[0]?.status === 'ACTIVE'
  })

  const { data, fetchData } = useFetch('https://api.sendwyre.com/v2/paymentMethods', {
    defaultData: { hasWyrelinkedBank: false },
    deferred: true,
    errorMessage: 'hasWyreLinkedBank not ok',
    asData: asWyrePromoFlags
  })

  useAsyncEffect(async () => {
    // Don't even try to fetch if the user is the store doesn't exists
    if (store == null) return

    // Wyre has two possible keys that hold the secret so we need to look in both places
    let secret
    try {
      secret = await store.getItem('co.edgesecure.wyre', 'wyreSecret')
    } catch (e) {
      secret = await store.getItem('co.edgesecure.wyre', 'wyreAccountId')
    }

    fetchData({
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }, [store])

  return data
}
